celery -A app.core.celery_app worker --loglevel=info --pool=solo

@REM sudo service redis-server restart