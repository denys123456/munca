FROM python:3.12-slim
WORKDIR /workspace
COPY championsclub_data ./championsclub_data
COPY config ./config
CMD ["python", "-m", "championsclub_data.cli", "generate", "--output", "/output", "--calibration", "/workspace/config/calibration.json"]
