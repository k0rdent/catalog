#### Install template to k0rdent

{{ install_code }}

#### Verify service template

{{ verify_code }}

#### Deploy service template

{{ deploy_code }}

Access "primary" replica using `5432` port to read/write operations.
~~~bash
PGPASSWORD=passwd psql -h <ip-or-address> -p 5432 -U user -d pgdb
~~~

Access "read" replica using `5433` port to read operations only.
~~~bash
PGPASSWORD=passwd psql -h <ip-or-address> -p 5433 -U user -d pgdb
~~~
