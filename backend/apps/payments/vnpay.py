import hashlib
import hmac
import urllib.parse
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any

from django.conf import settings
from django.utils import timezone


def _sorted_query(data: dict[str, Any]) -> str:
    parts = []
    for k in sorted(data.keys()):
        if data[k] is None or data[k] == "":
            continue
        parts.append(f"{k}={urllib.parse.quote_plus(str(data[k]))}")
    return "&".join(parts)


def build_payment_url(params: dict[str, Any], hash_secret: str, payment_url: str) -> str:
    sign_data = _sorted_query(params)
    secure_hash = hmac.new(
        hash_secret.encode("utf-8"),
        sign_data.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()
    params = {**params, "vnp_SecureHash": secure_hash}
    query = _sorted_query(params)
    return f"{payment_url}?{query}"


def verify_return(query_dict: dict[str, str], hash_secret: str) -> bool:
    data = {k: v for k, v in query_dict.items() if k not in ("vnp_SecureHash", "vnp_SecureHashType")}
    sign_data = _sorted_query(data)
    received = query_dict.get("vnp_SecureHash", "")
    calc = hmac.new(
        hash_secret.encode("utf-8"),
        sign_data.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(calc, received)


def default_vnpay_params(
    *,
    amount_vnd: int,
    order_id: str,
    order_desc: str,
    client_ip: str,
    return_url: str | None = None,
) -> dict[str, Any]:
    tmn = settings.VNPAY_TMN_CODE
    if not tmn:
        raise ValueError("VNPAY_TMN_CODE not configured")
    # VNPay sandbox expects timestamps in Vietnam timezone (GMT+7).
    now = timezone.localtime(timezone.now())
    expire_at = now + timedelta(minutes=15)
    return {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": tmn,
        "vnp_Locale": "vn",
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": order_id,
        "vnp_OrderInfo": order_desc[:255],
        "vnp_OrderType": "other",
        "vnp_Amount": str(int(amount_vnd) * 100),  # VNPAY expects amount * 100
        "vnp_ReturnUrl": return_url or settings.VNPAY_RETURN_URL,
        "vnp_IpAddr": client_ip or "127.0.0.1",
        "vnp_CreateDate": now.strftime("%Y%m%d%H%M%S"),
        "vnp_ExpireDate": expire_at.strftime("%Y%m%d%H%M%S"),
    }


def amount_from_booking_total(total: Decimal) -> int:
    return int(total.quantize(Decimal("1")))
