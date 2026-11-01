import os
import json
from flask import Flask, jsonify, request
from backend.database import db
from backend.models import Plan, User, Subscription
from backend.routes.auth_routes import auth_bp
from backend.routes.subscription_routes import subscription_bp

def create_app():
    app = Flask(__name__)
    
    # Configure SQLite database
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, 'voyage.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    # CORS support
    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
        return response

    @app.before_request
    def handle_preflight():
        if request.method == 'OPTIONS':
            return ('', 204)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(subscription_bp, url_prefix='/api/subscription')

    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok', 'service': 'Voyage AI Python Backend', 'version': '1.0.0'})

    # Initialize tables and seed default plans
    with app.app_context():
        db.create_all()
        seed_plans()

    return app

def seed_plans():
    existing_free = db.session.get(Plan, 'free')
    if not existing_free:
        plans = [
            Plan(
                id='free',
                name='Explorer',
                price=0.0,
                currency='USD',
                interval='month',
                trial_days=0,
                description='Perfect for occasional travelers',
                features_json=json.dumps([
                    '3 AI itineraries per month',
                    'Up to 7-day trip planning',
                    'Basic map view',
                    'Budget breakdown',
                    'PDF export',
                    'Community support'
                ])
            ),
            Plan(
                id='voyager',
                name='Voyager',
                price=12.0,
                currency='USD',
                interval='month',
                trial_days=7,
                description='For frequent travelers who want more',
                features_json=json.dumps([
                    'Unlimited AI itineraries',
                    'Up to 30-day trip planning',
                    'Interactive map with all pins',
                    'AI chat travel assistant',
                    'Advanced budget planner',
                    'Priority generation queue',
                    'PDF & share export',
                    'Cloud trip sync'
                ])
            ),
            Plan(
                id='elite',
                name='Elite',
                price=29.0,
                currency='USD',
                interval='month',
                trial_days=0,
                description='For travel agencies & power users',
                features_json=json.dumps([
                    'Everything in Voyager',
                    'Multi-city trip planning',
                    'Group trip collaboration',
                    'White-label PDF export',
                    'API access',
                    'Priority customer support',
                    'Custom AI training on preferences',
                    'Offline access'
                ])
            )
        ]
        for p in plans:
            db.session.add(p)
        db.session.commit()
        print("[Backend] Seeded default plans: Explorer, Voyager, Elite")

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    print(f"[Backend] Voyage AI Python/Flask running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
