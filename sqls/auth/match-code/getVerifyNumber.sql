select
	*
from
	verify_numbers
where
	phone='${phone}',
	and code='${code}',
	and type=${phone};