import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_register_login_and_homestay_list():
    client = APIClient()
    res = client.post(
        "/api/auth/register/",
        {
            "email": "api_smoke@test.local",
            "full_name": "Api Smoke",
            "password": "testpass12",
            "role": "guest",
        },
        format="json",
    )
    assert res.status_code == 201, res.content

    res = client.post(
        "/api/auth/login/",
        {"email": "api_smoke@test.local", "password": "testpass12"},
        format="json",
    )
    assert res.status_code == 200, res.content
    assert "access" in res.data
    assert "refresh" in res.data

    res = client.get("/api/homestays/")
    assert res.status_code == 200
