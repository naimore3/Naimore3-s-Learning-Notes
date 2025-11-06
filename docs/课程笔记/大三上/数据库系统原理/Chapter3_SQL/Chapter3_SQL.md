# 第三章：SQL
## 背景（Background）
### SQL 历史
- 1970年代：IBM 推出 Sequel（基于 System R）。
- 1986年：ANSI 和 ISO 发布 SQL-86 标准。
- 1987年：IBM 推出 SAA-SQL。
- 1989年：ANSI 发布 SQL-89，为 SQL 的扩展标准。
- 1992年：推出 SQL-92 标准。
- 1999年：推出 SQL-99 标准。
- 2003年：推出 SQL:2003 标准。
- 2008年：推出 SQL:2008 标准。
- 2011年：推出 SQL:2011 标准。

### SQL 组件
- 数据定义语言（DDL）：用于定义数据库结构相关信息。
- 数据操纵语言（DML）：用于对数据进行插入、删除、更新等操作。
- 数据控制语言（DCL）：包含完整性控制和授权管理功能。
- 嵌入式 SQL 和动态 SQL：适配不同应用场景的 SQL 使用方式。

### SQL 基础
SQL 基于集合和关系操作构建，在原有操作基础上进行了一定的修改和增强，以满足数据库管理的实际需求。

## 数据定义语言 (DDL)
### 1. DDL 的核心功能：指定关系信息
DDL 可定义关系的完整结构及关联属性，具体需指定以下内容：

- 每个关系的**模式**（即关系的属性构成及结构）；
- 每个属性对应的**域值**（即属性的取值范围和数据类型）；
- 保障数据有效性的**完整性约束**（如非空、主键、外键等）；
- 为提升查询效率的**索引集**（需明确为每个关系维护的索引）；
- 数据安全相关的**安全和授权信息**（如哪些用户可操作该关系）；
- 数据存储相关的**物理存储结构**（即关系在磁盘上的存储方式）。


### 2. 核心操作：创建表（Create Table）
#### 2.1 基本语法
```sql
create table r (
    A1 D1,  -- A1为属性名，D1为该属性的数据类型
    A2 D2,
    ...,
    An Dn,
    integrity_constraint1,  -- 第一个完整性约束
    ...,
    integrity_constraintk   -- 第k个完整性约束
)
```
其中，`r` 为关系（表）名，`Ai` 为表的属性名，`Di` 为属性 `Ai` 的数据类型，`integrity_constraint` 为表的完整性约束条件。

#### 2.2 基础示例
创建 `instructor`（教师表），包含教师编号、姓名、所属部门、薪资属性：
```sql
create table instructor (
    ID                char(5),    -- 教师编号，固定长度字符串
    name              varchar(20),-- 教师姓名，可变长度字符串
    dept_name         varchar(20),-- 所属部门，可变长度字符串
    salary            numeric(8,2)-- 薪资，固定点数（共8位，2位小数）
)
```


### 3. 关键保障：完整性约束
完整性约束用于确保表中数据的准确性和一致性，DDL 支持以下4类核心约束：

- **not null**：指定属性值不可为空（即该属性必须有值）；
- **primary key (A1, ..., An)**：指定 (A1,...,An) 为主键，主键属性值唯一且非空，用于唯一标识表中的元组；
- **foreign key (A1,...,An) references r on delete [restrict/cascade/set null]**：指定 (A1,...,An) 为外键，引用另一个表 `r` 的主键；`on delete` 后接删除策略（restrict：禁止删除关联数据；cascade：删除主表数据时联动删除从表关联数据；set null：删除主表数据时将从表外键设为null）；
- **check (P)**：指定谓词 `P` 为数据校验条件，只有满足 `P` 的值才能存入表中。

#### 3.1 带约束的示例
创建 `instructor` 表并添加完整性约束：
```sql
create table instructor (
    ID                char(5),
    name              varchar(20) not null,  -- 姓名不可为空
    dept_name         varchar(20),
    salary            numeric(8,2),
    primary key (ID),  -- 教师编号为主键
    foreign key (dept_name) references department  -- 部门名引用department表
)
```


### 4. 其他表定义示例
基于 DDL 可创建不同业务场景的表，以下为3个典型示例：
#### 4.1 student（学生表）
```sql
create table student (
    ID                varchar(5),    -- 学生编号
    name              varchar(20) not null,  -- 学生姓名（非空）
    dept_name         varchar(20),    -- 所属部门
    tot_cred          numeric(3,0),   -- 总学分（3位数字，0位小数）
    primary key (ID),  -- 学生编号为主键
    foreign key (dept_name) references department  -- 部门名引用department表
)
```

#### 4.2 takes（选课表）
```sql
create table takes (
    ID                varchar(5),    -- 学生编号
    course_id         varchar(8),    -- 课程编号
    sec_id            varchar(8),    -- 课程_section编号
    semester          varchar(6),    -- 学期（如Fall、Spring）
    year              numeric(4,0),   -- 年份（4位数字）
    grade             varchar(2),    -- 成绩（如A、B+）
    primary key (ID, course_id, sec_id, semester, year),  -- 联合主键（唯一标识选课记录）
    foreign key (ID) references student,  -- 学生编号引用student表
    foreign key (course_id, sec_id, semester, year) references section  -- 联合外键引用section表
)
```
> 注：`sec_id` 可从主键中省略，以避免学生在同一学期重复选同一课程的不同section。

#### 4.3 course（课程表）
```sql
create table course (
    course_id         varchar(8),    -- 课程编号
    title             varchar(50),   -- 课程名称
    dept_name         varchar(20),    -- 开课部门
    credits           numeric(2,0),   -- 课程学分（2位数字，0位小数）
    primary key (course_id),  -- 课程编号为主键
    foreign key (dept_name) references department  -- 部门名引用department表
)
```


### 5. 基础支撑：SQL 域类型
域类型定义属性的取值格式和范围，DDL 支持以下7类常用域类型：

- **char(n)**：固定长度字符串，长度由 `n` 指定（如 `char(5)` 表示固定5个字符）；
- **varchar(n)**：可变长度字符串，最大长度由 `n` 指定（如 `varchar(20)` 表示最多20个字符，实际长度随内容变化）；
- **int**：整数类型，取值范围为机器依赖的有限整数集；
- **smallint**：小整数类型，取值范围为机器依赖的更小整数集；
- **numeric(p,d)**：固定点数类型，`p` 表示总位数，`d` 表示小数点后位数（如 `numeric(8,2)` 表示最大为999999.99）；
- **real / double precision**：浮点数类型，`real` 为单精度，`double precision` 为双精度，精度均依赖机器；
- **float(n)**：浮点数类型，精度至少为 `n` 位（由 `n` 指定最小精度）。


### 6. 表的维护：删除和修改表
#### 6.1 删除表（Drop Table）
功能：删除表的所有数据及表结构，从数据库中彻底移除该关系。  
语法：
```sql
drop table r;  -- r为待删除的表名
```

#### 6.2 修改表（Alter Table）
核心功能：为已存在的表添加新属性（暂不支持直接删除或修改已有属性）。  
语法：
```sql
alter table r add A D;  -- r为表名，A为新属性名，D为新属性的域类型
```
示例：为 `instructor` 表添加“入职年份”属性（`hire_year`，int类型）：
```sql
alter table instructor add hire_year int;
```

## 基本查询结构（Basic Structure__query）
### 1. 典型查询形式与关系代数对应
SQL 基本查询的核心语法遵循“选择-来源-条件”逻辑，具体形式及与关系代数的对应关系如下：
- **语法格式**：
  ```sql
  select A1, A2, ..., An  -- 选择需返回的属性
  from r1, r2, ..., rm    -- 指定查询的数据来源（关系/表）
  where P                 -- 筛选满足条件的元组（谓词P）
  ```
- **关系代数等价式**：  
  该查询等价于对多个关系的笛卡尔积先做选择、再做投影，即：  
  $\Pi_{A1, A2, ..., An}(\sigma_P(r1 \times r2 \times ... \times rm))$  
  其中，$\sigma$ 表示选择操作（对应 `where` 子句），$\Pi$ 表示投影操作（对应 `select` 子句），$\times$ 表示笛卡尔积（对应 `from` 子句中的多个关系）。


### 2. Select 子句：定义返回的属性与数据格式
`select` 子句对应关系代数的**投影操作**，用于指定查询结果中需包含的属性及数据处理方式，核心功能如下：

#### 2.1 选择指定属性
仅返回目标属性，示例：查询所有教师的姓名（从 `instructor` 表中选择 `name` 属性）：
```sql
select name
from instructor;
```

#### 2.2 选择所有属性
用通配符 `*` 表示返回表中所有属性，示例：查询 `instructor` 表的全部数据：
```sql
select *
from instructor;
```

#### 2.3 支持算术表达式
可对属性进行 `+`、`-`、`*`、`/` 运算，示例：查询教师编号、姓名及月薪资（年薪 `salary` 除以 12）：
```sql
select ID, name, salary/12
from instructor;
```

#### 2.4 属性重命名（as 子句）
用 `as` 为结果属性指定新名称（`as` 可省略），示例：将“月薪”属性重命名为 `monthly_salary`：
```sql
select ID, name, salary/12 as monthly_salary
from instructor;
```

#### 2.5 去重与保留重复
- **去重**：用 `distinct` 消除结果中的重复元组，示例：查询所有教师所属的部门（避免重复部门名）：
  ```sql
  select distinct dept_name
  from instructor;
  ```
- **保留重复**：用 `all` 明确保留所有重复元组（默认行为，可省略 `all`），示例：
  ```sql
  select all dept_name
  from instructor;
  ```


### 3. Where 子句：筛选满足条件的元组
`where` 子句对应关系代数的**选择操作**，通过谓词筛选 `from` 子句中关系的元组，支持多种条件表达：

#### 3.1 基础谓词（等值/不等值判断）
示例：查询“计算机科学系（Comp. Sci.）”的所有教师姓名：
```sql
select name
from instructor
where dept_name = 'Comp. Sci.';  -- 等值谓词
```

#### 3.2 逻辑运算（and/or/not）
组合多个谓词，示例：查询“计算机科学系”中薪资大于 80000 的教师姓名：
```sql
select name
from instructor
where dept_name = 'Comp. Sci.' and salary > 80000;  -- and 组合
```

#### 3.3 范围判断（between...and）
简化“大于等于最小值且小于等于最大值”的条件，示例：查询薪资在 90000 到 100000 之间的教师姓名：
```sql
select name
from instructor
where salary between 90000 and 100000;  -- 等价于 salary >= 90000 and salary <= 100000
```

#### 3.4 元组比较
直接比较多个属性组成的“元组”，示例：查询与“生物学系（Biology）”教师有相同 ID 的教师姓名及授课课程号：
```sql
select name, course_id
from instructor, teaches
where (instructor.ID, dept_name) = (teaches.ID, 'Biology');  -- 元组等值比较
```


### 4. From 子句：指定查询的数据来源
`from` 子句指定查询所需的关系（表），多个关系时默认执行**笛卡尔积**（所有可能的元组组合），但通常需结合 `where` 子句筛选有效关联。

#### 4.1 笛卡尔积（无筛选）
直接返回多个表的所有元组组合（实际用途少，仅用于理解原理），示例：查询 `instructor` 与 `teaches` 的笛卡尔积：
```sql
select *
from instructor, teaches;  -- 结果包含两表所有元组的组合
```
> 注：若两表有同名属性（如 `ID`），结果中需用“表名.属性名”区分（如 `instructor.ID`、`teaches.ID`）。

#### 4.2 笛卡尔积+筛选（有效关联）
通过 `where` 子句指定关联条件，筛选出有意义的元组，示例：
1. 查询所有授课教师的姓名及所授课程号（关联 `instructor` 和 `teaches` 的 `ID`）：
   ```sql
   select name, course_id
   from instructor, teaches
   where instructor.ID = teaches.ID;  -- 关联条件：教师ID与授课ID一致
   ```
2. 进一步筛选“艺术系（Art）”的授课教师：
   ```sql
   select name, course_id
   from instructor, teaches
   where instructor.ID = teaches.ID and instructor.dept_name = 'Art';
   ```


### 5. 重命名操作（As Clause）
用 `as` 为表或属性指定别名（`as` 可省略），简化复杂查询（尤其多表关联或子查询），语法：`old_name as new_name`。

示例：查询薪资高于“计算机科学系”任意教师的教师姓名（用 `T` 和 `S` 分别作为 `instructor` 表的别名）：
```sql
select distinct T.name
from instructor as T, instructor as S  -- T和S均为instructor的别名
where T.salary > S.salary and S.dept_name = 'Comp. Sci.';
```


### 6. 字符串操作
SQL 支持对字符串属性的模糊匹配和常用处理，核心功能如下：

#### 6.1 模糊匹配（like 通配符）
- `%`：匹配任意长度的子串（包括空串）；
- `_`：匹配单个字符；
示例：查询姓名中包含“dar”的教师：
```sql
select name
from instructor
where name like '%dar%';  -- %匹配“dar”前后的任意字符
```

#### 6.2 转义字符（escape）
当需匹配 `%` 或 `_` 本身时，用 `escape` 指定转义字符（如 `\`），示例：查询名称以“Main%”开头的内容（匹配 `Main%` 而非通配符）：
```sql
select name
from table_name
where name like 'Main\%' escape '\';  -- \ 转义 %，使其视为普通字符
```

#### 6.3 其他字符串函数
- 连接：`||`（如 `name || '(' || dept_name || ')'` 生成“姓名(部门)”格式）；
- 大小写转换：`upper(属性)`（转大写）、`lower(属性)`（转小写）；
- 长度：`length(属性)`（返回字符串长度）；
- 子串：`substring(属性, 起始位置, 长度)`（提取子串）。


### 7. 结果排序（Order By）
用 `order by` 对查询结果按指定属性排序，默认**升序（asc）**，可指定**降序（desc）**，支持多属性排序。

#### 7.1 单属性排序
示例：按姓名字母升序排列所有教师：
```sql
select distinct name
from instructor
order by name;  -- 默认 asc，等价于 order by name asc
```
示例：按薪资降序排列“计算机科学系”教师：
```sql
select name, salary
from instructor
where dept_name = 'Comp. Sci.'
order by salary desc;  -- 降序
```

#### 7.2 多属性排序
按多个属性依次排序（前一属性相等时，按后一属性排序），示例：先按部门升序，再按姓名升序排列教师：
```sql
select dept_name, name
from instructor
order by dept_name, name;  -- 先部门、再姓名，均为升序
```


### 8. 多重集语义（支持重复元组）
SQL 与“纯关系代数”的区别之一是**支持重复元组**（即多重集），多重集版本的关系代数操作规则如下：

1. **选择（σ）**：若原关系有 `c1` 个满足条件的元组 `t1`，结果仍保留 `c1` 个 `t1`；
2. **投影（Π）**：若原关系有 `c1` 个元组 `t1`，投影后仍保留 `c1` 个投影后的元组；
3. **笛卡尔积（×）**：若关系 `r1` 有 `c1` 个元组 `t1`，关系 `r2` 有 `c2` 个元组 `t2`，则笛卡尔积有 `c1×c2` 个 `(t1, t2)` 元组。

示例：设 `r1 = {(1,a), (2,a)}`（2个元组），`r2 = {(2), (3), (3)}`（3个元组），则：
- `Π_B(r1)` 结果为 `{(a), (a)}`（保留重复）；
- `Π_B(r1) × r2` 结果为 `{(a,2), (a,3), (a,3), (a,2), (a,3), (a,3)}`（共 2×3=6 个元组）。


### 9. 集合操作（union/intersect/except）
对两个查询结果（需属性个数和类型一致）执行集合运算，默认**自动去重**，加 `all` 可**保留重复**。

| 操作符       | 功能描述                     | 示例场景                     |
|--------------|------------------------------|------------------------------|
| `union`      | 合并两个结果（去重）         | 2009年秋季或2010年春季的课程 |
| `union all`  | 合并两个结果（保留重复）     | 合并两批未去重的课程列表     |
| `intersect`  | 取两个结果的交集（去重）     | 2009年秋季且2010年春季的课程 |
| `intersect all` | 取交集（保留重复）         | 两批课程中重复出现的课程     |
| `except`     | 取第一个结果减第二个结果（去重） | 2009年秋季有但2010年春季没有的课程 |
| `except all` | 取差集（保留重复）           | 第一批课程比第二批多的课程   |

示例1：查询2009年秋季（Fall 2009）或2010年春季（Spring 2010）的课程号：
```sql
(select course_id from section where semester = 'Fall' and year = 2009)
union
(select course_id from section where semester = 'Spring' and year = 2010);
```

示例2：查询2009年秋季且2010年春季都有的课程号：
```sql
(select course_id from section where semester = 'Fall' and year = 2009)
intersect
(select course_id from section where semester = 'Spring' and year = 2010);
```


### 10. 聚合函数：对数据进行统计计算
聚合函数对关系中某列的多重集值进行统计，返回单个结果，常用函数及示例如下：

| 函数         | 功能                     | 示例场景                     |
|--------------|--------------------------|------------------------------|
| `avg(属性)`  | 计算该列的平均值         | 计算机系教师的平均薪资       |
| `min(属性)`  | 计算该列的最小值         | 教师的最低薪资               |
| `max(属性)`  | 计算该列的最大值         | 教师的最高薪资               |
| `sum(属性)`  | 计算该列的总和           | 计算机系教师的薪资总和       |
| `count(...)` | 计算元组/属性值的数量    | 2010年春季授课的教师人数     |

示例1：查询“计算机科学系”教师的平均薪资：
```sql
select avg(salary)
from instructor
where dept_name = 'Comp. Sci.';
```

示例2：查询2010年春季（Spring 2010）授课的不同教师人数（`distinct` 去重同一教师的多门课程）：
```sql
select count(distinct ID)
from teaches
where semester = 'Spring' and year = 2010;
```

示例3：查询 `course` 表的总元组数（`count(*)` 统计所有元组，包括属性为 `null` 的情况）：
```sql
select count(*)
from course;
```


### 11. 分组（Group By）：按属性分组统计
`group by` 将关系按指定属性的值分组，对**每组**单独应用聚合函数（而非整个关系）。  
⚠️ 核心规则：`select` 子句中，**非聚合函数的属性必须出现在 `group by` 列表中**（确保每组的该属性值唯一）。

示例：查询每个部门的平均薪资（按 `dept_name` 分组，对每组计算 `avg(salary)`）：
```sql
select dept_name, avg(salary) as avg_salary
from instructor
group by dept_name;  -- 按部门分组
```

❌ 错误示例（`ID` 是非聚合属性且未在 `group by` 中）：
```sql
select dept_name, ID, avg(salary)  -- 错误：ID未在group by中，每组可能有多个ID
from instructor
group by dept_name;
```


### 12. Having 子句：筛选分组后的结果
`having` 子句用于**分组后**筛选满足条件的组（与 `where` 子句的区别：`where` 筛选元组，`having` 筛选组），需结合 `group by` 使用。

示例：查询平均薪资大于 42000 的部门及其平均薪资：
```sql
select dept_name, avg(salary)
from instructor
group by dept_name
having avg(salary) > 42000;  -- 筛选平均薪资超42000的组
```


### 13. Null 值处理
`null` 表示“未知值”或“不存在的值”，SQL 对 `null` 的处理有特殊规则，需重点注意：

#### 13.1 Null 的基本特性
- 算术运算：任何包含 `null` 的算术表达式结果为 `null`（如 `5 + null = null`）；
- 检查 `null`：需用 `is null` 或 `is not null`（不能用 `=` 或 `!=`），示例：查询薪资为 `null` 的教师姓名：
  ```sql
  select name
  from instructor
  where salary is null;
  ```

#### 13.2 聚合函数对 Null 的处理
- 除 `count(*)` 外，所有聚合函数（`avg`/`min`/`max`/`sum`/`count(属性)`）均**忽略 `null` 值**；
- 若某列所有值均为 `null`：`count(属性)` 返回 0，其他聚合函数返回 `null`。

示例：计算所有教师的薪资总和（自动忽略薪资为 `null` 的教师）：
```sql
select sum(salary)
from instructor;
```

#### 13.3 三值逻辑（true/false/unknown）
比较 `null` 时，结果既不是 `true` 也不是 `false`，而是 `unknown`，SQL 三值逻辑规则如下：
- **OR**：`unknown or true = true`；`unknown or false = unknown`；`unknown or unknown = unknown`；
- **AND**：`true and unknown = unknown`；`false and unknown = false`；`unknown and unknown = unknown`；
- **NOT**：`not unknown = unknown`；
- `where` 子句中：`unknown` 视为 `false`（即不筛选该元组）。

示例：`salary > null` 的结果为 `unknown`，在 `where` 中视为 `false`，因此该条件不会筛选任何元组。

## 嵌套子查询（Nested Subqueries）
嵌套子查询指在一个SQL查询（主查询）中嵌套的另一个`select-from-where`表达式，其结果可作为主查询的属性值、数据来源或筛选条件。子查询需满足“单一结果维度”（如标量子查询返回单个值、集合子查询返回单列多值），且仅在主查询执行时临时生效。


### 1. 嵌套子查询的核心位置
子查询可嵌入主查询的三个关键位置，分别实现不同功能：
- **`select`子句中**：作为属性值（需为标量子查询，返回单个值），用于为每条主查询结果附加计算数据；
- **`from`子句中**：作为临时关系（需返回多列多值），等同于“临时表”，可被主查询直接引用；
- **`where`子句中**：作为筛选条件（需返回单列多值或布尔结果），用于过滤主查询的元组。


### 2. 集合成员测试：`In`与`Not In`
通过`in`判断属性值是否在子查询返回的结果集中，`not in`则判断是否不在结果集中，适用于“多值匹配”场景。

#### 2.1 基本语法
```sql
-- In：属性值在子查询结果中
where 属性 [not] in (select 子查询属性 from 表 where 子查询条件);
```

#### 2.2 典型示例
1. **查询2009年秋季（Fall 2009）和2010年春季（Spring 2010）都开设的课程号**：  
   用`in`匹配“2010年春季课程”的结果集，筛选“2009年秋季课程”中重合的部分：
   ```sql
   select distinct course_id
   from section
   where semester = 'Fall' and year = 2009 
         and course_id in (-- 子查询：2010年春季的所有课程号
                           select course_id 
                           from section 
                           where semester = 'Spring' and year = 2010);
   ```

2. **查询2009年秋季有但2010年春季没有的课程号**：  
   用`not in`排除“2010年春季课程”的结果集：
   ```sql
   select distinct course_id
   from section
   where semester = 'Fall' and year = 2009 
         and course_id not in (-- 子查询：2010年春季的所有课程号
                               select course_id 
                               from section 
                               where semester = 'Spring' and year = 2010);
   ```

3. **查询选过教师ID=10101所授课程的学生总数**：  
   用`in`匹配“教师10101的授课记录”（多属性组合），筛选`takes`表中的相关学生：
   ```sql
   select count(distinct ID)
   from takes
   where (course_id, sec_id, semester, year) in (-- 子查询：教师10101的授课信息
                                                select course_id, sec_id, semester, year 
                                                from teaches 
                                                where teaches.ID = 10101);
   ```


### 3. 集合比较：`Some`与`All`
用于将属性值与子查询返回的**所有结果**进行比较，`some`表示“至少大于/小于一个”，`all`表示“大于/小于所有”，需结合比较运算符（`>`, `<`, `>=`, `<=`, `=`, `!=`）使用。

#### 3.1 核心定义
- `F <comp> some r`：存在子查询结果集中的元组`t`，使得`F <comp> t`成立（“至少一个满足”）；
- `F <comp> all r`：对子查询结果集中的所有元组`t`，都有`F <comp> t`成立（“全部满足”）。

#### 3.2 典型示例
1. **查询薪资高于“生物学系（Biology）”至少一位教师的教师姓名**：  
   用`> some`匹配“Biology系教师薪资”中至少一个值：
   ```sql
   select name
   from instructor
   where salary > some (-- 子查询：Biology系所有教师的薪资
                       select salary 
                       from instructor 
                       where dept_name = 'Biology');
   ```

2. **查询薪资高于“生物学系”所有教师的教师姓名**：  
   用`> all`匹配“Biology系教师薪资”的所有值：
   ```sql
   select name
   from instructor
   where salary > all (-- 子查询：Biology系所有教师的薪资
                      select salary 
                      from instructor 
                      where dept_name = 'Biology');
   ```

#### 3.3 补充说明
- `= some` 等价于 `in`（“等于至少一个”即“在集合中”）；
- `!= all` 等价于 `not in`（“不等于所有”即“不在集合中”）；
- 若子查询结果为空，`some`比较返回`false`，`all`比较返回`true`（逻辑上“空集的所有元素满足条件”）。


### 4. 存在性测试：`Exists`与`Not Exists`
通过`exists`判断子查询是否返回**非空结果**（无需关注具体值，仅需“是否有数据”），`not exists`则判断子查询结果为空。该操作常与“关联子查询”结合（子查询引用主查询的属性）。

#### 4.1 基本语法
```sql
-- Exists：子查询非空则返回true
where [not] exists (select * from 表 where 关联条件);
```
> 注：子查询中`select *`可替换为任意属性（如`select 1`），因仅判断是否存在元组，不依赖具体值。

#### 4.2 典型示例
1. **查询2009年秋季和2010年春季都开设的课程号**：  
   用`exists`关联主查询的`course_id`与子查询的`course_id`，判断“该课程是否在2010年春季开设”：
   ```sql
   select course_id
   from section as S  -- S为关联名，供子查询引用
   where semester = 'Fall' and year = 2009 
         and exists (-- 子查询：判断S.course_id是否在2010年春季开设
                     select * 
                     from section as T 
                     where semester = 'Spring' and year = 2010 
                           and S.course_id = T.course_id);
   ```

2. **查询选过“生物学系”所有课程的学生ID和姓名**：  
   核心逻辑：“生物学系课程集 - 学生已选课程集”为空（即学生已选课程包含所有生物学系课程），用`not exists`判断该差集是否为空：
   ```sql
   select distinct S.ID, S.name
   from student as S
   where not exists (-- 子查询1：生物学系所有课程
                     (select course_id 
                      from course 
                      where dept_name = 'Biology')
                     except  -- 差集：生物学系课程中未被该学生选的课程
                     (-- 子查询2：该学生已选的所有课程
                      select T.course_id 
                      from takes as T 
                      where S.ID = T.ID));
   ```


### 5. 唯一性测试：`Unique`与`Not Unique`
通过`unique`判断子查询返回的结果集中**无重复元组**，`not unique`则判断存在重复元组，适用于“检查数据是否唯一”的场景。

#### 5.1 基本语法
```sql
-- Unique：子查询结果无重复则返回true
where [not] unique (select 子查询属性 from 表 where 条件);
```

#### 5.2 典型示例
**查询2009年最多开设过一次的课程号**：  
用`unique`判断“该课程2009年的开设记录”是否无重复（即仅开设一次或未开设）：
```sql
select T.course_id
from course as T
where unique (-- 子查询：该课程2009年的所有开设记录
             select R.course_id 
             from section as R 
             where T.course_id = R.course_id 
                   and R.year = 2009);
```


### 6. `From`子句中的子查询
将子查询作为**临时关系**（等同于“临时表”），嵌入`from`子句供主查询引用，需为临时关系指定别名（若需多次引用），适用于“先计算中间结果，再基于中间结果查询”的场景。

#### 6.1 典型示例
**查询平均薪资大于42000的部门及其平均薪资**：  
先通过子查询计算每个部门的平均薪资（中间结果），再筛选平均薪资超42000的部门：
```sql
select dept_name, avg_salary
from (-- 子查询：计算每个部门的平均薪资（临时关系）
      select dept_name, avg(salary) as avg_salary 
      from instructor 
      group by dept_name)
where avg_salary > 42000;
```

#### 6.2 临时关系重命名
若需明确临时关系的属性名，可通过`as`指定别名及属性列表：
```sql
select dept_name, avg_salary
from (-- 子查询：计算每个部门的平均薪资，并重命名临时关系为dept_avg
      select dept_name, avg(salary) 
      from instructor 
      group by dept_name) as dept_avg (dept_name, avg_salary)  -- 指定临时关系的属性名
where avg_salary > 42000;
```


### 7. `With`子句：定义临时关系集
`with`子句用于提前定义一个或多个**临时关系**（仅在当前查询中生效，查询结束后释放），简化复杂嵌套查询（尤其多子查询复用场景），语法结构为“定义临时关系 → 主查询引用”。

#### 7.1 基本语法
```sql
with 临时关系1(属性1, 属性2, ...) as (子查询1),
     临时关系2(属性1, 属性2, ...) as (子查询2)
-- 主查询：引用with子句定义的临时关系
select ... from 临时关系1, 临时关系2 where ...;
```

#### 7.2 典型示例
1. **查询预算最高的部门名称**：  

   先定义`max_budget`（临时关系，存储最高预算值），再关联`department`表查询对应部门：
   ```sql
   with max_budget (value) as (-- 临时关系：存储最高预算值
                               select max(budget) 
                               from department)
-- 主查询：关联部门表与临时关系，找到预算等于最高值的部门
select department.name
from department, max_budget
where department.budget = max_budget.value;
```

2. **查询总薪资大于“所有部门总薪资平均值”的部门**：  
   定义两个临时关系（`dept_total`存储各部门总薪资，`dept_total_avg`存储总薪资的平均值），再筛选符合条件的部门：
   ```sql
   with dept_total (dept_name, value) as (-- 临时关系1：各部门总薪资
                                          select dept_name, sum(salary) 
                                          from instructor 
                                          group by dept_name),
        dept_total_avg (value) as (-- 临时关系2：所有部门总薪资的平均值
                                   select avg(value) 
                                   from dept_total)
-- 主查询：筛选总薪资大于平均值的部门
select dept_name
from dept_total, dept_total_avg
where dept_total.value > dept_total_avg.value;
```


### 8. `Select`子句中的标量子查询（Scalar Subquery）
嵌入`select`子句的子查询，需返回**单个值**（标量），用于为每条主查询结果附加“基于其他表计算的属性值”，若子查询返回多个值则会报错。

#### 8.1 典型示例
**查询所有部门及其对应的教师人数**：  
主查询遍历`department`表的每个部门，子查询计算该部门的教师数量，作为`num_instructors`属性返回：
```sql
select dept_name,
       -- 标量子查询：计算当前部门的教师人数
       (select count(*) 
        from instructor 
        where department.dept_name = instructor.dept_name) as num_instructors
from department;
```

#### 8.2 补充说明
- 若子查询无结果（如某部门无教师），返回`null`；
- 标量子查询需与主查询通过关联条件（如`department.dept_name = instructor.dept_name`）绑定，否则会返回“全局唯一值”（所有部门的教师数相同）。


### 9. 嵌套子查询的集合操作总结
嵌套子查询中常用的集合操作符可分为四类，覆盖“成员匹配”“比较”“存在性”“唯一性”场景，具体如下：

| 操作类型       | 关键运算符                          | 核心功能                                  |
|----------------|-------------------------------------|-------------------------------------------|
| 集合成员测试   | `in` / `not in`                     | 判断属性值是否在子查询结果集中            |
| 集合比较       | `> some` / `< some` / `> all` / `< all`  | 属性值与子查询结果集中的部分/全部值比较    |
| 存在性测试     | `exists` / `not exists`             | 判断子查询结果是否非空/空                  |
| 唯一性测试     | `unique` / `not unique`             | 判断子查询结果是否无重复/有重复            |

## 数据操纵语言（DML: Insert, Delete, Update）
数据操纵语言（DML）用于对数据库表中的数据进行**增、删、改**操作，核心目标是维护表中数据的有效性和准确性，同时遵循表的完整性约束（如主键唯一、外键关联等）。


### 1. 删除操作（Deletion）
通过`delete`语句删除表中满足指定条件的元组，若不指定条件则删除表中所有元组（表结构保留，仅清空数据）。

#### 1.1 基本语法
```sql
delete from r  -- r为目标表名
where P;       -- P为筛选条件（可选，不写则删除所有元组）
```
> 关键规则：删除前会先计算`where`子句中的条件（如子查询结果），再批量删除符合条件的元组，过程中不会动态更新条件（避免删除过程中条件变化导致错误）。

#### 1.2 典型示例
1. **删除表中所有元组**：清空`instructor`表的所有教师数据（表结构仍存在）：
   ```sql
   delete from instructor;  -- 无where条件，删除所有元组
   ```

2. **按简单条件删除**：删除“金融系（Finance）”的所有教师：
   ```sql
   delete from instructor
   where dept_name = 'Finance';  -- 条件：部门名为Finance
   ```

3. **通过子查询条件删除**：删除“位于Watson大楼的部门”对应的所有教师（先通过子查询找到目标部门，再删除关联教师）：
   ```sql
   delete from instructor
   where dept_name in (-- 子查询：找到位于Watson大楼的部门名
                       select dept_name 
                       from department 
                       where building = 'Watson');
   ```

4. **基于聚合子查询删除**：删除薪资低于所有教师平均薪资的教师（先计算平均薪资，再删除低于该值的元组）：
   ```sql
   delete from instructor
   where salary < (-- 子查询：计算所有教师的平均薪资（删除前固定该值）
                   select avg(salary) 
                   from instructor);
   ```
   > 注意：SQL会先执行子查询得到平均薪资，再基于该固定值删除元组，不会因删除过程中薪资平均值变化而重新计算。


### 2. 插入操作（Insertion）
通过`insert`语句向表中添加新元组，支持直接指定值插入、指定属性顺序插入，以及基于子查询结果批量插入。

#### 2.1 基本语法
分为两种场景，核心区别是是否显式指定目标属性：
1. **不指定属性（按表结构顺序插入）**：
   ```sql
   insert into r
   values (v1, v2, ..., vn);  -- v1~vn需与表r的属性顺序、数据类型完全匹配
   ```
2. **指定属性（按指定顺序插入）**：
   ```sql
   insert into r (A1, A2, ..., An)  -- 显式指定要插入的属性及顺序
   values (v1, v2, ..., vn);        -- v1~vn对应A1~An的取值
   ```

#### 2.2 典型示例
1. **按表结构顺序插入**：向`course`表插入“数据库系统”课程（需严格匹配`course`表的属性顺序：course_id、title、dept_name、credits）：
   ```sql
   insert into course
   values ('CS-437', 'Database Systems', 'Comp. Sci.', 4);
   ```

2. **指定属性顺序插入**：插入同上课程，但显式指定属性顺序（即使与表结构顺序不同也可）：
   ```sql
   insert into course (course_id, title, dept_name, credits)
   values ('CS-437', 'Database Systems', 'Comp. Sci.', 4);
   ```
   > 优势：当表结构调整（如新增属性）时，指定属性插入可避免因顺序变化导致的错误。

3. **插入带null值的元组**：向`student`表插入“Green”同学，其总学分（tot_cred）暂未确定，设为`null`：
   ```sql
   insert into student
   values ('3003', 'Green', 'Finance', null);  -- tot_cred属性值为null
   ```
   > 前提：`tot_cred`属性未设置`not null`约束（否则插入失败）。

4. **基于子查询批量插入**：将`instructor`表的教师数据批量插入`student`表，总学分（tot_cred）设为0：
   ```sql
   insert into student
   select ID, name, dept_name, 0  -- 子查询结果：教师的ID、姓名、部门，总学分为0
   from instructor;
   ```
   > 关键规则：子查询的结果需与目标表的属性数量、数据类型匹配；会先完整执行子查询，再将结果批量插入，避免“插入过程中读取自身新增数据”的循环问题（如`insert into r select * from r`不会无限循环）。


### 3. 更新操作（Update）
通过`update`语句修改表中满足条件的元组的指定属性值，支持简单赋值、算术运算赋值，以及基于子查询的动态赋值。

#### 3.1 基本语法
```sql
update r        -- r为目标表名
set A1 = expr1, -- A1为待修改属性，expr1为新值（可含算术运算、子查询）
    A2 = expr2, -- 支持同时修改多个属性
    ...
where P;        -- P为筛选条件（可选，不写则修改表中所有元组）
```

#### 3.2 典型示例
1. **按条件分批次更新**：调整教师薪资——薪资超过100000的加3%，其余加5%（需分两次执行，注意顺序：先更新高薪教师，避免低薪教师被重复修改）：
   ```sql
   -- 第一步：更新薪资>100000的教师（加3%）
   update instructor
   set salary = salary * 1.03
   where salary > 100000;

   -- 第二步：更新薪资<=100000的教师（加5%）
   update instructor
   set salary = salary * 1.05
   where salary <= 100000;
   ```

2. **用Case语句优化多条件更新**：上述薪资调整可通过`case`语句合并为一次执行（避免顺序问题）：
   ```sql
   update instructor
   set salary = case
                   when salary <= 100000 then salary * 1.05  -- 低薪加5%
                   else salary * 1.03                       -- 高薪加3%
                end;  -- 无where条件，所有教师均被修改（按case分支匹配）
   ```

3. **基于子查询动态更新**：重新计算所有学生的总学分（`tot_cred`），仅统计成绩不为F且成绩非null的课程学分：
   ```sql
   update student S  -- S为student表的别名，用于关联子查询
   set tot_cred = (-- 子查询：计算当前学生（S.ID）的有效课程总学分
                   select case
                           -- 若总学分为null（未选任何课），设为0
                           when sum(credits) is not null then sum(credits)
                           else 0
                         end
                   from takes, course
                   where takes.course_id = course.course_id  -- 关联课程表获取学分
                         and S.ID = takes.ID                  -- 关联当前学生
                         and takes.grade <> 'F'              -- 排除不及格课程
                         and takes.grade is not null);       -- 排除成绩未录入的课程
   ```
   > 核心：通过`S.ID = takes.ID`将主表（student）与子查询（takes）关联，实现“按学生个体动态计算并更新”。

## 索引（Index）
索引是数据库中用于**提升查询效率**的辅助数据结构，通过对表中指定列构建有序索引表，可快速定位满足查询条件的数据，避免全表扫描。以下为SQL中索引的核心操作：


### 1. 基本索引创建（CREATE INDEX）
通过`CREATE INDEX`语句创建普通索引，适用于需频繁按某列查询但无需保证列值唯一的场景。

#### 1.1 基本语法
```sql
CREATE INDEX 索引名 ON 表名(索引列名);
```
- **索引名**：自定义的索引标识（需唯一，便于后续管理）；
- **表名**：要创建索引的目标表；
- **索引列名**：基于该列构建索引（需为表中已存在的属性）。

#### 1.2 示例
为`STUDENT`表的`HEIGHT`（身高）列创建名为`H_INDEX`的索引，用于快速查询特定身高的学生：
```sql
CREATE INDEX H_INDEX ON STUDENT(HEIGHT);
```


### 2. 唯一索引创建（CREATE UNIQUE INDEX）
通过`CREATE UNIQUE INDEX`语句创建唯一索引，除提升查询效率外，还能**强制索引列的值唯一**（类似`unique`约束），避免列中出现重复数据。

#### 2.1 基本语法
```sql
CREATE UNIQUE INDEX 索引名 ON 表名(索引列1 [排序方式], 索引列2 [排序方式], ...);
```
- **UNIQUE**：核心关键字，指定索引列值唯一；
- **排序方式**：可选`ASC`（升序，默认）或`DESC`（降序），用于定义索引表中数据的排序规则；
- **多列索引**：支持基于多个列创建组合索引（需按查询场景确定列的顺序，优先放置查询频率高的列）。

#### 2.2 示例
为`SC`表（学生选课表）的`SNO`（学生编号）和`CNO`（课程编号）列创建唯一组合索引`SC_INDEX`，其中`SNO`按升序、`CNO`按降序排序，既提升选课记录的查询效率，又确保“同一学生-同一课程”的组合不重复：
```sql
CREATE UNIQUE INDEX SC_INDEX ON SC(SNO ASC, CNO DESC);
```


### 3. 索引删除（DROP INDEX）
通过`DROP INDEX`语句删除不再使用的索引，释放索引占用的存储资源，避免不必要的维护开销（删除索引不影响表本身的数据）。

#### 3.1 基本语法
```sql
DROP INDEX 索引名;
```
- **索引名**：需删除的索引标识（需与创建时的索引名完全一致）。

#### 3.2 示例
删除`STUDENT`表中名为`H_INDEX`的索引：
```sql
DROP INDEX H_INDEX;
```

#### 3.3 注意事项
- 删除索引后，基于该索引的查询会恢复为全表扫描，可能降低查询性能，需确认索引不再使用后再删除；
- 若索引关联的表被删除，索引会自动同步删除，无需手动操作。

## 总结 (Summary)
- 查询：SELECT。
- 修改：Delete, Insert, Update。
- 定义：Table, View。

## 示例问题
- 关系：R(RNO, name)，B(RNO, BookNO)。
- 等价于 Π_RNO(R) - Π_RNO(σ_BookNO=“B01”(R ⋈ B)) 的 SQL：B. select RNO from R where RNO NOT IN (select RNO from B where BookNO = “B01”)。