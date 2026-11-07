from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.finding import FindingPatch, FindingPatchOut
from app.services import workflow_service as wf

router = APIRouter(prefix="/findings", tags=["findings"])


@router.patch("/{finding_id}", response_model=FindingPatchOut)
def patch_finding(finding_id: str, body: FindingPatch, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return wf.decide_finding(db, user, finding_id, body)
