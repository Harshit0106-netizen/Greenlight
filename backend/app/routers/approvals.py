from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.review import WorkflowNote, WorkflowOut
from app.services import workflow_service as wf

router = APIRouter(prefix="/reviews", tags=["approvals"])


@router.post("/{review_id}/approve", response_model=WorkflowOut)
def approve(review_id: str, body: WorkflowNote, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return wf.approve(db, user, review_id, body.note)


@router.post("/{review_id}/request-changes", response_model=WorkflowOut)
def request_changes(review_id: str, body: WorkflowNote, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return wf.request_changes(db, user, review_id, body.note)
