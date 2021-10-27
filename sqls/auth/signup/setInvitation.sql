update
    invitation
set
    user_id = '${userId}'
where
    is_denied = false
    and phone = '${phone}';