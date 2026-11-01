import hashlib
import os
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from backend.database import db
from backend.models import User, Subscription, Plan

auth_bp = Blueprint('auth', __name__)

# Simple in-memory token session store: token -> user_id
# Can also be stored in DB if desired
AUTH_TOKENS = {}

def hash_password(password: str) -> str:
    salt = "voyage_ai_salt_secure"
    return hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()

def get_current_user():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1].strip()
    user_id = AUTH_TOKENS.get(token)
    if user_id:
        return db.session.get(User, user_id)

    # Recover user from structured token tok_usr_xxxx_xxxx across server restarts
    if token.startswith('tok_usr_'):
        parts = token.split('_')
        if len(parts) >= 3:
            recovered_id = f"usr_{parts[2]}"
            user = db.session.get(User, recovered_id)
            if user:
                AUTH_TOKENS[token] = user.id
                return user

    # Fallback check if token itself is user_id
    user = db.session.get(User, token)
    return user

def ensure_user_has_subscription(user: User):
    """Ensures user always has at least a Free subscription"""
    existing_sub = Subscription.query.filter_by(user_id=user.id).order_by(Subscription.created_at.desc()).first()
    if not existing_sub:
        free_sub = Subscription(
            id=f"sub_{uuid.uuid4().hex[:14]}",
            user_id=user.id,
            plan_id='free',
            provider='system',
            status='free',
            current_period_start=datetime.now(timezone.utc)
        )
        db.session.add(free_sub)
        db.session.commit()
        return free_sub
    return existing_sub

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    name = data.get('name', '').strip()

    if not email:
        return jsonify({'error': 'Email is required'}), 400
    if not password:
        password = "voyage_default_pass" # Allow passwordless / fast signup

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'Email already registered. Please sign in.'}), 409

    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    user = User(
        id=user_id,
        email=email,
        name=name or email.split('@')[0],
        password_hash=hash_password(password)
    )
    db.session.add(user)
    db.session.commit()

    ensure_user_has_subscription(user)

    token = f"tok_{user.id}_{uuid.uuid4().hex[:12]}"
    AUTH_TOKENS[token] = user.id

    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()
    
    # If user doesn't exist, auto-register for seamless testing/access
    if not user:
        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        user = User(
            id=user_id,
            email=email,
            name=email.split('@')[0],
            password_hash=hash_password(password or "voyage_default_pass")
        )
        db.session.add(user)
        db.session.commit()

    ensure_user_has_subscription(user)

    token = f"tok_{user.id}_{uuid.uuid4().hex[:12]}"
    AUTH_TOKENS[token] = user.id

    sub = Subscription.query.filter_by(user_id=user.id).order_by(Subscription.created_at.desc()).first()

    return jsonify({
        'token': token,
        'user': user.to_dict(),
        'subscription': sub.to_dict() if sub else None
    }), 200

@auth_bp.route('/me', methods=['GET'])
def me():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized', 'authenticated': False}), 401

    sub = ensure_user_has_subscription(user)
    return jsonify({
        'authenticated': True,
        'user': user.to_dict(),
        'subscription': sub.to_dict() if sub else None
    })
