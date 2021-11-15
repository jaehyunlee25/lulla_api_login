update 
    invitation
set 
    user_id = '${userId}'
where
    phone = '${phone}'
    and confirmed = false
    and is_denied = false;