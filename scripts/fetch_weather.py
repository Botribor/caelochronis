#!/usr/bin/env python3
"""Pubblica soltanto le osservazioni della stazione, mai la chiave privata."""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

STATION_ID = "IDALMI6"
OUTPUT = Path("data/latest.json")

def num(v):
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def append_hourly_history(record, observed_at):
    """Una osservazione reale per ora UTC, in file mensili pubblici."""
    directory = Path("data/history")
    directory.mkdir(parents=True, exist_ok=True)
    archive = directory / (observed_at.strftime("%Y-%m") + ".json")
    rows = []
    if archive.exists():
        try:
            rows = json.loads(archive.read_text(encoding="utf-8"))
            if not isinstance(rows, list):
                raise ValueError("Archivio non valido.")
        except (ValueError, OSError):
            print("Archivio storico esistente non leggibile: non lo sovrascrivo.")
            return 1
    hour = observed_at.strftime("%Y-%m-%dT%H")
    for row in rows:
        if isinstance(row, dict) and str(row.get("observedAt", "")).startswith(hour):
            print("Ora già registrata nello storico.")
            return 0
    rows.append(record)
    rows.sort(key=lambda row: row.get("observedAt", ""))
    archive.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Storico aggiornato: {archive}")
    return 0

def main():
    key = os.environ.get("WU_API_KEY", "").strip()
    if not key:
        print("Secret WU_API_KEY mancante: non pubblico osservazioni.")
        return 0
    params = urllib.parse.urlencode({
        "stationId": STATION_ID,
        "format": "json", "units": "m",
        "numericPrecision": "decimal", "apiKey": key
    })
    # ATTENZIONE: non stampare l'URL, contiene la chiave privata.
    url = "https://api.weather.com/v2/pws/observations/current?" + params
    req = urllib.request.Request(url, headers={"User-Agent": "AetherisWeather/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            payload = json.load(response)
    except urllib.error.HTTPError as error:
        print(f"Weather Underground HTTP {error.code}: verifica ID e secret.")
        return 1
    except (urllib.error.URLError, TimeoutError, ValueError):
        print("Impossibile leggere l'API meteorologica.")
        return 1
    readings = payload.get("observations") or []
    if not readings:
        print("Nessuna osservazione recente: nessun aggiornamento.")
        return 0
    observation = readings[0]
    try:
        dt = datetime.fromisoformat(observation["obsTimeUtc"].replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        dt = dt.astimezone(timezone.utc)
    except (ValueError, KeyError, TypeError):
        print("Data di osservazione non valida.")
        return 1
    age = datetime.now(timezone.utc) - dt
    if age > timedelta(minutes=60) or age < -timedelta(minutes=5):
        print("Osservazione scaduta o con data futura: non aggiorno i dati.")
        return 0
    metric = observation.get("metric") or {}
    record = {
        "stationId": STATION_ID,
        "source": "Weather Underground PWS",
        "observedAt": dt.isoformat().replace("+00:00", "Z"),
        "temp": num(metric.get("temp")),
        "humidity": num(observation.get("humidity")),
        "pressure": num(metric.get("pressure")),
        "windSpeed": num(metric.get("windSpeed")),
        "windGust": num(metric.get("windGust")),
        "winddir": num(observation.get("winddir")),
        "precipTotal": num(metric.get("precipTotal")),
        "precipRate": num(metric.get("precipRate")),
        "uv": num(observation.get("uv")),
        "solarRadiation": num(observation.get("solarRadiation")),
        "dewpt": num(metric.get("dewpt")),
    }
    OUTPUT.parent.mkdir(exist_ok=True, parents=True)
    contents = json.dumps(record, ensure_ascii=False, indent=2) + "\n"
    if OUTPUT.exists() and OUTPUT.read_text(encoding="utf-8") == contents:
        print("I dati attuali non sono cambiati.")
    else:
        OUTPUT.write_text(contents, encoding="utf-8")
        print(f"Osservazione pubblicabile: {record['observedAt']}")
    return append_hourly_history(record, dt)

if __name__ == "__main__":
    sys.exit(main())
