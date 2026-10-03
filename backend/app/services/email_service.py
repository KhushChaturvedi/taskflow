import base64
import threading
from email.mime.text import MIMEText
from html import escape

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.config import Config

GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


def _get_gmail_service():
    credentials = Credentials(
        token=None,
        refresh_token=Config.GMAIL_REFRESH_TOKEN,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=Config.GOOGLE_CLIENT_ID,
        client_secret=Config.GOOGLE_CLIENT_SECRET,
        scopes=GMAIL_SCOPES,
    )
    return build("gmail", "v1", credentials=credentials, cache_discovery=False)


def send_email(to, subject, html_body):
    message = MIMEText(html_body, "html")
    message["to"] = to
    message["from"] = f"TaskFlow <{Config.GMAIL_SENDER_EMAIL}>"
    message["subject"] = subject.replace("\n", " ").replace("\r", " ")
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    try:
        _get_gmail_service().users().messages().send(
            userId="me", body={"raw": raw}
        ).execute()
        return True
    except Exception as error:
        print(f"Failed to send email to {to}: {error}")
        return False


def send_email_async(to, subject, html_body):
    thread = threading.Thread(
        target=send_email, args=(to, subject, html_body), daemon=True
    )
    thread.start()


def _display_name(user):
    return escape(user.get("name") or user.get("email") or "there")


def _task_details(task):
    title = escape(task.get("title") or "")
    description = escape(task.get("description") or "No description")
    due_date = escape(task.get("due_date") or "No due date")
    return (
        f'<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">'
        f'<tr><td style="padding:8px 0;color:#6b7280;width:110px">Task</td>'
        f'<td style="padding:8px 0;color:#111827;font-weight:600">{title}</td></tr>'
        f'<tr><td style="padding:8px 0;color:#6b7280">Description</td>'
        f'<td style="padding:8px 0;color:#111827">{description}</td></tr>'
        f'<tr><td style="padding:8px 0;color:#6b7280">Due date</td>'
        f'<td style="padding:8px 0;color:#111827">{due_date}</td></tr>'
        f"</table>"
    )


def _layout(heading, intro_html, task):
    link = f"{Config.FRONTEND_URL}/dashboard"
    return (
        f'<div style="background:#f3f4f6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif">'
        f'<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">'
        f'<p style="margin:0 0 8px;color:#4f46e5;font-weight:700;font-size:14px">TaskFlow</p>'
        f'<h2 style="margin:0 0 16px;color:#111827;font-size:22px">{heading}</h2>'
        f'<div style="color:#374151;font-size:15px;line-height:1.6">{intro_html}</div>'
        f"{_task_details(task)}"
        f'<a href="{link}" style="display:inline-block;padding:12px 20px;background:#4f46e5;'
        f'color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">Open TaskFlow</a>'
        f"</div></div>"
    )


def notify_task_created(task, creator):
    html_body = _layout(
        "Your task was created",
        f"<p>Hi {_display_name(creator)},</p><p>Your new task has been created successfully.</p>",
        task,
    )
    send_email_async(creator["email"], f"Task created: {task['title']}", html_body)


def notify_task_assigned(task, assignee, creator):
    html_body = _layout(
        "A task was assigned to you",
        f"<p>Hi {_display_name(assignee)},</p>"
        f"<p><strong>{_display_name(creator)}</strong> assigned you a new task.</p>",
        task,
    )
    send_email_async(
        assignee["email"], f"New task assigned: {task['title']}", html_body
    )


def notify_task_completed(task, creator, completer):
    html_body = _layout(
        "A task was completed",
        f"<p>Hi {_display_name(creator)},</p>"
        f"<p><strong>{_display_name(completer)}</strong> marked this task as completed.</p>",
        task,
    )
    send_email_async(creator["email"], f"Task completed: {task['title']}", html_body)
