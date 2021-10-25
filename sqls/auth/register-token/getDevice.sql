select
    *
from
    device
where
    token = '${deviceToken}'
    and type = ${type};