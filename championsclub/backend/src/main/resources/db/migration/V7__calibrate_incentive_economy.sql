update gamification_configuration
set silver = 60000,
    gold = 120000,
    updated_at = now()
where id = 1;
