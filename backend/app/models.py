# backend/app/models.py

from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base
from datetime import datetime

class Server(Base):
    __tablename__ = "servers"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, nullable=False, index=True)
    hostname = Column(String, nullable=True)
    model = Column(String, nullable=True)
    service_tag = Column(String, nullable=True)
    warranty_expiry = Column(DateTime, nullable=True)
    firmware_version = Column(String, nullable=True)
    health_status = Column(String, default="unknown")  # ok, warning, critical
    last_checked = Column(DateTime, default=datetime.utcnow)
    raw_data = Column(Text, nullable=True)  # store full JSON if needed
