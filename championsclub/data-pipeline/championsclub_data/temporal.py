import calendar
from datetime import date, datetime, time, timezone


def event_instant(random_generator, event_date, first_hour, last_hour):
    event_time = time(
        random_generator.randint(first_hour, last_hour),
        random_generator.randint(0, 59),
        random_generator.randint(0, 59),
        tzinfo=timezone.utc
    )
    return datetime.combine(event_date, event_time)


def month_range(period_start, period_end):
    current = period_start.replace(day=1)
    final_month = period_end.replace(day=1)
    while current <= final_month:
        yield current
        if current.month == 12:
            current = date(current.year + 1, 1, 1)
        else:
            current = date(current.year, current.month + 1, 1)


def end_of_month(month_start):
    return date(month_start.year, month_start.month, calendar.monthrange(month_start.year, month_start.month)[1])


def month_identifier(value):
    return f"{value.year:04d}-{value.month:02d}"


def iso_instant(value):
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
