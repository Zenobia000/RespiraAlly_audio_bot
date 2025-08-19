"""
Standalone CSV seeder that mirrors the logic of services/web-app/seed_data.py
but writes Faker-generated data to CSV files using pandas instead of the DB.

Output files (relative to this script):
  - seed_csv_output/users.csv
  - seed_csv_output/staff_details.csv
  - seed_csv_output/health_profiles.csv
  - seed_csv_output/daily_metrics.csv
  - seed_csv_output/questionnaire_cat.csv
  - seed_csv_output/questionnaire_mmrc.csv

Run:
  python services/web-app/seed_data_csv.py
"""

from __future__ import annotations

import random
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Tuple

import pandas as pd
from faker import Faker
from werkzeug.security import generate_password_hash


# --- Configuration ---
NUM_THERAPISTS = 5
NUM_PATIENTS = 50
DATA_MONTHS = 12  # number of months of historical data


# --- Initialization ---
fake = Faker("zh_TW")
now_utc = lambda: datetime.now(timezone.utc)


# --- Helpers ---
def get_mmrc_answer(score: int) -> str:
    """Return the MRC Dyspnea Scale description for a given score (0-4)."""
    answers: Dict[int, str] = {
        0: "只有在激烈運動時，才會感到呼吸困難",
        1: "在平路快走或爬緩坡時，會感到呼吸短促",
        2: "在平路走路時，因為呼吸困難，走得比同齡者慢，或需要停下來休息",
        3: "走平路約一百公尺或走幾分鐘後，會因呼吸困難而需要停下來休息",
        4: "因為嚴重呼吸困難而無法外出，或在穿脫衣物時感到呼吸困難",
    }
    return answers.get(score, "")


def ensure_output_dir() -> Path:
    out_dir = Path(__file__).parent / "seed_csv_output"
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir


# --- Generators ---
def generate_users(num_therapists: int, num_patients: int) -> Tuple[pd.DataFrame, List[int], List[int]]:
    """
    Create admin, therapists, and patients.

    Returns:
        - users_df
        - therapist_ids: list of user ids for therapists
        - patient_ids: list of user ids for patients
    """

    rows: List[Dict] = []
    next_id = 1
    created_time = now_utc().isoformat()

    # Admin
    admin_id = next_id
    next_id += 1
    rows.append(
        {
            "id": admin_id,
            "account": "admin",
            "password_hash": generate_password_hash("admin"),
            "is_staff": True,
            "is_admin": True,
            "first_name": "Admin",
            "last_name": "User",
            "gender": None,
            "email": "admin@example.com",
            "phone": None,
            "last_login": None,
            "line_user_id": None,
            "created_at": created_time,
            "updated_at": created_time,
        }
    )

    # Therapists
    therapist_ids: List[int] = []
    for i in range(num_therapists):
        user_id = next_id
        next_id += 1
        first_name = fake.first_name()
        last_name = fake.last_name()
        account = f"therapist_{i+1:02d}"
        email = f"{account}@example.com"  # ensure uniqueness

        rows.append(
            {
                "id": user_id,
                "account": account,
                "password_hash": generate_password_hash("password"),
                "is_staff": True,
                "is_admin": False,
                "first_name": first_name,
                "last_name": last_name,
                "gender": None,
                "email": email,
                "phone": fake.phone_number(),
                "last_login": None,
                "line_user_id": None,
                "created_at": created_time,
                "updated_at": created_time,
            }
        )
        therapist_ids.append(user_id)

    # Patients
    patient_ids: List[int] = []
    for i in range(num_patients):
        user_id = next_id
        next_id += 1
        first_name = fake.first_name()
        last_name = fake.last_name()
        account = f"patient_{i+1:03d}"
        email = f"{account}@example.com"  # ensure uniqueness

        rows.append(
            {
                "id": user_id,
                "account": account,
                "password_hash": generate_password_hash("password"),
                "is_staff": False,
                "is_admin": False,
                "first_name": first_name,
                "last_name": last_name,
                "gender": random.choice(["male", "female", "other"]),
                "email": email,
                "phone": fake.phone_number(),
                "last_login": None,
                "line_user_id": f"U{uuid.uuid4().hex}",
                "created_at": created_time,
                "updated_at": created_time,
            }
        )
        patient_ids.append(user_id)

    users_df = pd.DataFrame(rows)
    return users_df, therapist_ids, patient_ids


def generate_staff_details(therapist_ids: List[int]) -> pd.DataFrame:
    rows: List[Dict] = []
    for i, uid in enumerate(therapist_ids, start=1):
        rows.append({"id": i, "user_id": uid, "title": "呼吸治療師"})
    return pd.DataFrame(rows)


def generate_health_profiles(patient_ids: List[int], therapist_ids: List[int]) -> pd.DataFrame:
    rows: List[Dict] = []
    updated_time = now_utc().isoformat()
    for i, uid in enumerate(patient_ids, start=1):
        rows.append(
            {
                "id": i,
                "user_id": uid,
                "height_cm": random.randint(150, 190),
                "weight_kg": random.randint(50, 100),
                "smoke_status": random.choice(["never", "quit", "current"]),
                "staff_id": random.choice(therapist_ids),
                "updated_at": updated_time,
            }
        )
    return pd.DataFrame(rows)


def generate_historical_data(
    patient_ids: List[int],
    health_profiles_df: pd.DataFrame,
    months: int,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Generate daily metrics and monthly questionnaires for each patient."""

    today = date.today()

    daily_rows: List[Dict] = []
    cat_rows: List[Dict] = []
    mmrc_rows: List[Dict] = []

    # Map patient -> smoke_status for cigarettes logic
    smoke_map: Dict[int, str] = (
        health_profiles_df.set_index("user_id")["smoke_status"].to_dict()
    )

    daily_id = 1
    cat_id = 1
    mmrc_id = 1

    for patient_id in patient_ids:
        # Daily metrics for months*30 days
        for day_delta in range(months * 30):
            log_date = today - timedelta(days=day_delta)
            daily_rows.append(
                {
                    "id": daily_id,
                    "user_id": patient_id,
                    "water_cc": random.randint(1500, 3000),
                    "medication": random.choice([True, False]),
                    "exercise_min": random.randint(0, 60),
                    "cigarettes": (
                        random.randint(0, 20)
                        if smoke_map.get(patient_id) == "current"
                        else 0
                    ),
                    "created_at": datetime.combine(log_date, datetime.min.time(), tzinfo=timezone.utc).isoformat(),
                    "updated_at": datetime.combine(log_date, datetime.min.time(), tzinfo=timezone.utc).isoformat(),
                }
            )
            daily_id += 1

        # Monthly questionnaires
        for month_delta in range(months):
            year = today.year
            month = today.month - month_delta
            while month <= 0:
                month += 12
                year -= 1

            record_date = date(year, month, random.randint(1, 28))
            created_ts = datetime.combine(record_date, datetime.min.time(), tzinfo=timezone.utc).isoformat()

            # CAT
            scores = {
                f: random.randint(0, 5)
                for f in [
                    "cough",
                    "phlegm",
                    "chest",
                    "breath",
                    "limit",
                    "confidence",
                    "sleep",
                    "energy",
                ]
            }
            total_score = sum(scores.values())
            cat_rows.append(
                {
                    "id": cat_id,
                    "user_id": patient_id,
                    "cough_score": scores["cough"],
                    "phlegm_score": scores["phlegm"],
                    "chest_score": scores["chest"],
                    "breath_score": scores["breath"],
                    "limit_score": scores["limit"],
                    "confidence_score": scores["confidence"],
                    "sleep_score": scores["sleep"],
                    "energy_score": scores["energy"],
                    "total_score": total_score,
                    "record_date": record_date.isoformat(),
                    "created_at": created_ts,
                }
            )
            cat_id += 1

            # MMRC
            mmrc_score = random.randint(0, 4)
            mmrc_rows.append(
                {
                    "id": mmrc_id,
                    "user_id": patient_id,
                    "score": mmrc_score,
                    "answer_text": get_mmrc_answer(mmrc_score),
                    "record_date": record_date.isoformat(),
                    "created_at": created_ts,
                }
            )
            mmrc_id += 1

    daily_df = pd.DataFrame(daily_rows)
    cat_df = pd.DataFrame(cat_rows)
    mmrc_df = pd.DataFrame(mmrc_rows)
    return daily_df, cat_df, mmrc_df


def to_csv(df: pd.DataFrame, path: Path) -> None:
    # use utf-8-sig for better Excel compatibility
    df.to_csv(path, index=False, encoding="utf-8-sig")


def main() -> None:
    out_dir = ensure_output_dir()

    users_df, therapist_ids, patient_ids = generate_users(
        num_therapists=NUM_THERAPISTS, num_patients=NUM_PATIENTS
    )
    staff_df = generate_staff_details(therapist_ids)
    health_df = generate_health_profiles(patient_ids, therapist_ids)
    daily_df, cat_df, mmrc_df = generate_historical_data(
        patient_ids, health_df, months=DATA_MONTHS
    )

    # Persist
    to_csv(users_df, out_dir / "users.csv")
    to_csv(staff_df, out_dir / "staff_details.csv")
    to_csv(health_df, out_dir / "health_profiles.csv")
    to_csv(daily_df, out_dir / "daily_metrics.csv")
    to_csv(cat_df, out_dir / "questionnaire_cat.csv")
    to_csv(mmrc_df, out_dir / "questionnaire_mmrc.csv")

    print("=" * 20)
    print("CSV 測試資料輸出完成！")
    print(f"治療師人數: {len(therapist_ids)}")
    print(f"病患人數: {len(patient_ids)}")
    print(f"輸出目錄: {out_dir}")
    print("=" * 20)


if __name__ == "__main__":
    main()


