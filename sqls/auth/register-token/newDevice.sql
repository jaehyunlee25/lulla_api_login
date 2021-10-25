insert into 
    device(
        id,
        type,
        token,
        created_at,
        updated_at,
        user_id
    )
values(
    uuid_generate_v1(),
    ${type},
    '${deviceToken}',
    now(),
    now(),
    '${userId}'
) returning id;