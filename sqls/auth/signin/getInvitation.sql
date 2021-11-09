select 
    i.id,
	s.name,
	i.role_name,
	to_char(i.created_at, 'YYYY.MM.DD') date
from 
    invitation i
	left join schools s on s.id = i.school_id
where
    user_id = '${userId}'
    and confirmed = false
    and is_denied = false;