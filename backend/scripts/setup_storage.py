#!/usr/bin/env python3
"""Create the private Storage bucket for candidate CVs."""

from app.services.storage_service import ensure_candidate_cvs_bucket


def main():
    bucket = ensure_candidate_cvs_bucket()
    print(f"Storage bucket '{bucket}' ready.")
    print("Bucket visibility: private")


if __name__ == "__main__":
    main()