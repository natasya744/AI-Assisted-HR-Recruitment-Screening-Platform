from pydantic import BaseModel


class EmailDraftOutput(BaseModel):
    email_subject: str
    email_body: str