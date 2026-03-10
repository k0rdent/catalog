#### Install template to k0rdent

{{ install_code }}

#### Verify service template

{{ verify_code }}

#### Deploy service template

{{ deploy_code }}

Access database using `5432` port to read/write operations.
~~~bash
PGPASSWORD=passwd psql -h <ip-or-address> -p 5432 -U user -d pgdb
~~~
