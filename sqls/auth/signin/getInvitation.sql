select 
    *
from 
    invitation
where
    user_id = '${userId}'
    and is_denied =false;