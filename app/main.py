from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from models import User, Ticket, SessionLocal
from auth import get_db, hash_password, verify_password
from fastapi.middleware.cors import CORSMiddleware


from pydantic import BaseModel

class TicketCreate(BaseModel):
    title: str
    department: str 
    created_by: str
app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.post("/signup")
def signup(username: str, password: str, role: str, db: Session = Depends(get_db)):
    hashed_pw = hash_password(password)
    user = User(username=username, password=hashed_pw, role=role)
    db.add(user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/login")
def login(username: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"user_id": user.id, "role": user.role}

@app.post("/tickets")
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):
    new_ticket = Ticket(
        title=ticket.title, 
        department=ticket.department, 
        created_by=ticket.created_by
    )
    db.add(new_ticket)
    db.commit()
    return {"message": "Ticket created"}

@app.put("/tickets/{ticket_id}/assign")
def update_ticket(ticket_id: int, agent_name: str = None, status: str = None, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if agent_name: ticket.assigned_to = agent_name
    if status: ticket.status = status
    db.commit()
    return {"message": "Updated"}


@app.put("/tickets/{ticket_id}/assign")
def assign_ticket(ticket_id: int, agent_name: str, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.assigned_to = agent_name
    ticket.status = "In Progress"
    db.commit()
    return {"message": "Assigned successfully"}    

@app.get("/tickets")
def get_tickets(db: Session = Depends(get_db)):
    return db.query(Ticket).all()


@app.post("/logout")
def logout_user(username: str):
    print(f"User {username} logged out at 4:00 PM")
    return {"message": "Logged out successfully"}    