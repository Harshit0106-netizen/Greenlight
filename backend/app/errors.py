"""One error shape everywhere: {"error": {"code": ..., "message": ...}}."""
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

_CODES = {401: "unauthorized", 403: "forbidden", 404: "not_found", 422: "validation_error", 500: "server_error"}


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str):
        self.status, self.code, self.message = status, code, message


def unauthorized(msg="Authentication required."): return ApiError(401, "unauthorized", msg)
def forbidden(msg="You do not have permission to do this."): return ApiError(403, "forbidden", msg)
def not_found(msg="Not found."): return ApiError(404, "not_found", msg)
def invalid(msg="Invalid request."): return ApiError(422, "validation_error", msg)


def _body(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


async def api_error_handler(_: Request, exc: ApiError):
    return JSONResponse(status_code=exc.status, content=_body(exc.code, exc.message))


async def http_error_handler(_: Request, exc: StarletteHTTPException):
    code = _CODES.get(exc.status_code, "server_error" if exc.status_code >= 500 else "validation_error")
    return JSONResponse(status_code=exc.status_code, content=_body(code, str(exc.detail)))


async def validation_error_handler(_: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    where = ".".join(str(p) for p in first.get("loc", []) if p != "body")
    message = f"{where}: {first.get('msg', 'invalid value')}" if where else first.get("msg", "Invalid request.")
    return JSONResponse(status_code=422, content=_body("validation_error", message))


async def unhandled_error_handler(_: Request, __: Exception):
    return JSONResponse(status_code=500, content=_body("server_error", "Something went wrong on our side."))
