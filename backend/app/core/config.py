import secrets
import warnings
from typing import Annotated, Any, Literal

from pydantic import (
    AnyUrl,
    BeforeValidator,
    EmailStr,
    HttpUrl,
    PostgresDsn,
    computed_field,
    model_validator,
)

from pydantic_core import MultiHostHost, Url
from pydantic_settings import BaseSettings
from typing_extensions import Self

# Do we want to have .env files? 
# from dotenv import load_dotenv
# from os import getenv
# load_dotenv()

def parse_cors(v: Any) -> list[str] | str:
    # Parsing cross origin
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)

class Settings(BaseSettings):
    PROJECT_NAME: str = "CLANK"
    API_STR: str = "/clank"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # a week 60 minutes * 24 hours * 7 days

    FRONTEND_HOST: list[str] = ["http://localhost"] # NOTE: do remind me which port does react/vitejs run on?
    ENVIRONMENT: Literal["local", "production"] = "local"

    BACKEND_CORS_ORIGINS: Annotated[list[AnyUrl] | str, BeforeValidator(parse_cors)] = [
        # we can leave this empty 
    ]

    @computed_field
    @property
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + self.FRONTEND_HOST
    
    def _check_default_secret(self, var_name:str, value:str|None) -> None:
        # checks the secret for placeholders
        if value == "changethis":
            message = (
                f'the value of {var_name} is "changethis", '
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT == "local":
                warnings.warn(message, stacklevel=1)
            else:
                raise ValueError(message)
    
    @model_validator(mode="after")
    def _enforce_non_default_secrets(self):
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        return self
    
settings = Settings()
