# Chapter3: SQL
## SQL 概述与背景
1. **SQL定义**：全称为Structured Query Language（结构化查询语言），是用于与数据库交互、实现数据管理的标准化语言。
2. **发展历程**：遵循清晰的时间演进线，从1970年代IBM在System R系统中推出Sequel起步；1986年ANSI（美国国家标准协会）与ISO（国际标准化组织）联合发布首个标准SQL_86；1987年IBM推出SAA_SQL；1989年ANSI发布扩展标准SQL_89；后续陆续更新至SQL_92、1999 SQL、SQL:2003、SQL:2008，最终到SQL:2011。
3. **核心组成**：包含四大关键模块，分别是用于定义数据结构的**数据定义语言（DDL）**、用于操作数据的**数据操纵语言（DML）**、负责数据安全与规则的**数据控制语言（DCL，含数据完整性保障、访问授权）**，以及适用于复杂场景的**嵌入式SQL与动态SQL**。
4. **底层基础**：以集合运算和关系运算为技术基石，同时结合实际应用需求进行了特定的修改与功能增强，确保语言的实用性与灵活性。
## 数据定义语言（DDL）
DDL（Data Definition Language，数据定义语言）是SQL中用于定义、管理数据库结构（如关系、属性、约束等）的核心模块，核心目标是搭建数据库的“骨架”，明确数据的组织规则与存储规范，具体内容如下：

### 一、DDL核心功能
DDL的核心作用是**定义数据库的结构与元数据**，而非操作具体数据，主要涵盖6类关键信息的定义：
1. **关系集定义**：确定数据库中包含的所有关系（即表），明确各表的名称与作用；
2. **关系属性信息定义**：
   - 表的**模式**：指定每个表包含的属性（列）名称及属性间的逻辑关联；
   - 属性的**域**：定义每个属性的取值范围（通过数据类型约束）；
   - **完整性约束**：设置数据的有效性规则（如主键唯一、外键关联、非空等），确保数据准确性；
   - **索引**：定义为提升查询效率而创建的索引（后续单独展开）；
   - **安全授权**：指定不同用户对表的访问权限（如查询、修改权限）；
   - **物理存储结构**：定义表在磁盘上的存储方式（如存储位置、文件格式等，通常由数据库管理系统自动优化，用户可按需配置）。


### 二、表创建：CREATE TABLE 语句
CREATE TABLE是DDL中最基础的命令，用于创建新的关系（表），明确表的属性、数据类型及完整性约束。

#### 1. 基本语法
```sql
create table r (
    A1 D1,   -- A1：属性名，D1：该属性的数据类型
    A2 D2,
    ...,
    An Dn,
    完整性约束1,  -- 对表或属性的约束规则
    ...,
    完整性约束k
);
```
- 核心参数说明：
  - `r`：新创建表的名称（即关系名），需符合数据库命名规范（如不重复、不包含特殊字符）；
  - `Ai`：表中的第i个属性名（列名），需唯一标识某一列（如“ID”“name”）；
  - `Di`：属性Ai的数据类型（如char(5)、int等），限制该属性的取值类型与格式；
  - `完整性约束`：可选但关键，用于定义数据的有效性规则，避免无效或错误数据存入。

#### 2. 典型表创建示例
PPT中以数据库常见的“教学管理场景”为例，创建了4个核心表，清晰体现CREATE TABLE的应用：
- **instructor表（教师表）**：存储教师的基本信息，包含属性ID（教师编号）、name（姓名）、dept_name（所属部门）、salary（工资），并设置主键（ID）、非空（name）、外键（dept_name关联部门表）等约束；
- **student表（学生表）**：存储学生信息，属性包括ID（学生编号）、name（姓名）、dept_name（所属部门）、tot_cred（总学分），主键为ID，外键为dept_name，且name非空；
- **takes表（选课表）**：存储学生选课记录，属性有ID（学生编号）、course_id（课程编号）、sec_id（课节号）、semester（学期）、year（年份）、grade（成绩），主键为多属性组合（ID+course_id+sec_id+semester+year，确保同一学生同一学期不重复选同一课程的同一课节），外键分别关联student表（ID）和section表（course_id+sec_id+semester+year）；
- **course表（课程表）**：存储课程信息，属性包括course_id（课程编号）、title（课程名称）、dept_name（所属部门）、credits（学分），主键为course_id，外键为dept_name。


### 三、完整性约束：确保数据有效性的规则
完整性约束是DDL的核心组成部分，用于限制表中数据的取值范围与逻辑关联，避免“脏数据”（如主键重复、外键无关联、非空属性为空等），PPT中重点介绍4类常用约束：

#### 1. 常用约束类型及作用
| 约束类型                | 语法格式                                  | 核心作用                                                                 |
|-------------------------|-------------------------------------------|--------------------------------------------------------------------------|
| NOT NULL（非空约束）    | 属性名 数据类型 not null                  | 限制该属性的值不能为NULL（未知或不存在的值），确保关键信息必填（如姓名）   |
| PRIMARY KEY（主键约束） | primary key (A1, A2, ..., An)             | 定义表的主键（唯一标识表中每一条元组的属性/属性组合），主键值必须唯一且非空 |
| FOREIGN KEY（外键约束） | foreign key (A1,...,An) references 表r [on delete 规则] | 建立表间关联：指定当前表的属性（A1...An）关联另一表r的主键，确保引用的有效性；<br>**on delete规则**：<br>- restrict：若被关联表r的主键记录被删除，当前表关联记录存在则禁止删除；<br>- cascade：被关联表r的主键记录删除时，当前表关联记录同步删除；<br>- set null：被关联表r的主键记录删除时，当前表关联属性值设为NULL（需关联属性允许NULL） |
| CHECK（检查约束）       | check (P)（P为谓词，如salary > 0）        | 自定义数据取值规则，仅当数据满足谓词P时可存入（如工资必须大于0）           |

#### 2. 约束应用示例（以instructor表为例）
```sql
create table instructor (
    ID char(5),
    name varchar(20) not null,  -- NOT NULL约束：姓名必填
    dept_name varchar(20),
    salary numeric(8,2),
    primary key (ID),           -- PRIMARY KEY约束：ID为教师唯一标识
    foreign key (dept_name) references department  -- FOREIGN KEY约束：关联部门表
);
```
该示例中，通过3类约束确保教师数据有效：
- `name not null`：避免“无姓名的教师”记录；
- `primary key (ID)`：避免“教师编号重复”；
- `foreign key (dept_name) references department`：避免“教师所属部门不存在”（如dept_name为“不存在的部门”时无法插入）。


### 四、SQL数据类型：定义属性的取值格式
数据类型是对属性“域”的具体实现，规定属性的取值类型、长度、精度等，PPT中按“字符型”和“数值型”分类介绍核心类型：

#### 1. 字符型（存储文本数据）
| 数据类型       | 语法格式       | 特点与适用场景                                                                 |
|----------------|----------------|------------------------------------------------------------------------------|
| char(n)        | char(固定长度n) | 固定长度字符串：无论实际存储的文本长度如何，均占用n个字符的存储空间；<br>适用：长度固定的文本（如教师ID char(5)、性别 char(1)） |
| varchar(n)     | varchar(最大n) | 可变长度字符串：实际存储长度随文本内容变化，最大不超过n个字符；<br>适用：长度不固定的文本（如姓名 varchar(20)、课程名称 varchar(50)），节省存储空间 |

#### 2. 数值型（存储数值数据）
| 数据类型               | 语法格式          | 特点与适用场景                                                                 |
|------------------------|-------------------|------------------------------------------------------------------------------|
| int                    | int               | 整数类型：取值范围为数据库管理系统（如MySQL、Oracle）依赖的有限整数集；<br>适用：无需小数的整数（如年份 int、课节号 int） |
| smallint               | smallint          | 小整数类型：取值范围小于int，占用存储空间更少；<br>适用：数值范围小的整数（如学分 smallint，通常1-10） |
| numeric(p, d)          | numeric(总精度p, 小数位d) | 定点数：精确存储数值，总位数为p（含整数位和小数位），小数部分固定为d位；<br>适用：需精确计算的数值（如工资 numeric(8,2)，表示最大999999.99，保留2位小数） |
| real / double precision | real / double precision | 浮点型/双精度浮点型：近似存储数值，精度由数据库管理系统决定（double精度高于real）；<br>适用：对精度要求不高的数值（如成绩排名 real） |
| float(n)               | float(精度n)      | 浮点型：精度至少为n位（由用户指定最低精度）；<br>适用：需自定义最低精度的浮点数据（如实验数据 float(10)） |


### 五、表操作：修改与删除表结构
DDL除了创建表，还支持对已存在表的结构进行修改（ALTER TABLE）或删除（DROP TABLE），PPT中重点介绍这两个命令：

#### 1. DROP TABLE：删除表
- 作用：**彻底删除表的所有信息**，包括表的结构（属性、约束等）和表中存储的所有数据，删除后无法恢复（需谨慎操作）；
- 基本语法：`drop table 表名;`
- 示例：`drop table instructor;`（删除instructor表，表中所有教师数据及表结构均被清除）。

#### 2. ALTER TABLE：修改表结构（重点：添加属性）
- 核心作用：在不删除表的前提下，修改表的结构（PPT中重点介绍“添加属性”，其他修改如删除属性、修改数据类型等可扩展）；
- 添加属性的语法：`alter table r add A D;`
  - 参数说明：`r`为目标表名，`A`为新添加的属性名，`D`为新属性的数据类型；
  - 注意事项：新添加的属性默认允许NULL（若需非空，需后续通过ALTER TABLE补充约束），且添加后所有已存在的元组中，该属性值均为NULL；
- 示例：`alter table instructor add email varchar(50);`（为instructor表添加“email”属性，类型为可变长度字符串，最大50个字符，已存在的教师记录中email字段值为NULL）。

## SQL查询基本结构
SQL查询的基本结构是实现数据检索的核心框架，围绕“选择-来源-筛选”逻辑展开，同时包含结果处理（如去重、排序、字符串匹配）等基础功能，具体内容如下：


### 1. 基本语法与关系代数对应
SQL基本查询语句的标准格式为：
```sql
select A1, A2, ..., An
from r1, r2, ..., rm
where P
```
- **参数含义**：
  - `A1,A2,...,An`：需检索的目标属性（列），可指定单个/多个属性或通过通配符覆盖所有属性；
  - `r1,r2,...,rm`：数据来源的关系（表），查询会对这些表执行笛卡尔积操作；
  - `P`：筛选条件（谓词），用于过滤笛卡尔积结果中不符合需求的元组（行）。
- **关系代数对应**：该语句等价于关系代数的“投影-选择-笛卡尔积”组合运算，即  
  `ΠA1,A2,...,An(σP (r1 × r2 × ... × rm))`，最终查询结果本身也是一个关系（具备关系的结构化特性）。


### 2. SELECT子句：定义检索结果的属性
SELECT子句对应关系代数的“投影操作”，核心作用是从数据源中提取指定属性，形成最终结果的列结构，支持多种灵活用法：
- **基础功能**：明确列出需检索的属性，例如`select name, dept_name from instructor`（提取教师的姓名和所属部门）。
- **特殊用法**：
  - 通配符`*`：表示“检索所有属性”，例如`select * from instructor`（提取教师表的所有列），无需逐一列出属性，适用于需完整数据的场景；
  - 算术表达式：支持对数值型属性进行`+`、`-`、`*`、`/`运算，例如`select ID, name, salary/12 from instructor`（计算教师月薪并作为结果列）；
  - 属性重命名（AS子句）：用`as`关键字为结果列指定新名称，增强可读性，例如`select salary/12 as monthly_salary`（将“月薪”列命名为`monthly_salary`），`as`可省略（如`salary/12 monthly_salary`）。
- **重复处理基础**：SQL默认保留查询结果中的重复元组，可通过关键字控制：
  - `distinct`：删除结果中的重复元组，例如`select distinct dept_name from instructor`（提取所有不重复的部门名称）；
  - `all`：显式保留重复元组（默认行为，可省略），例如`select all dept_name from instructor`（保留部门名称的重复项）。


### 3. WHERE子句：筛选符合条件的元组
WHERE子句对应关系代数的“选择操作”，核心作用是在`from`子句的笛卡尔积结果上，按指定条件过滤元组，仅保留符合谓词`P`的行：
- **逻辑连接符**：支持用`and`（且）、`or`（或）、`not`（非）组合多个条件，例如  
  `where dept_name = 'Comp. Sci.' and salary > 80000`（筛选计算机科学系且工资超8万的教师）。
- **特殊运算符**：
  - `between...and`：匹配数值/日期的连续范围，包含边界值，例如`where salary between 90000 and 100000`（筛选工资在9万-10万之间的教师），等价于`salary >= 90000 and salary <= 100000`；
  - 元组比较：支持多属性组合比较，例如`where (instructor.ID, dept_name) = (teaches.ID, 'Biology')`（匹配“教师ID与授课ID一致，且部门为生物系”的元组），需保证两侧元组的属性数量和类型一致。


### 4. FROM子句：指定数据来源与笛卡尔积
FROM子句的核心作用是指定查询的数据源（关系/表），并对这些表执行笛卡尔积操作（即所有表的元组两两组合）：
- **笛卡尔积特性**：若`from`后有`r1`（m行）和`r2`（n行），则笛卡尔积结果为`m×n`行，包含两表的所有属性；但直接使用笛卡尔积结果通常无实际意义，需结合`where`子句筛选有效关联。
- **常见用法（表连接基础）**：通过`where`子句指定“表间关联条件”，将笛卡尔积的无效组合过滤，形成有效连接，例如  
  `select name, course_id from instructor, teaches where instructor.ID = teaches.ID`（通过`ID`关联教师表和授课表，获取教师姓名与所授课程ID）。
- **属性重名处理**：当多个表存在同名属性（如`instructor`和`teaches`均有`ID`）时，需用“表名.属性名”的格式区分，例如`instructor.ID`（教师ID）、`teaches.ID`（授课教师ID），避免歧义。


### 5. 重命名操作（AS）：简化表/属性引用
SQL支持用`as`关键字对表或属性重命名，核心作用是简化复杂查询（尤其是多表自连接、子查询）中的引用，`as`可省略：
- **表重命名**：格式为`表名 as 别名`，例如`from instructor as T, instructor as S`（将教师表分别重命名为`T`和`S`），适用于“同一表需多次引用”的场景（如比较同一表中不同元组的属性，如“查询工资高于生物系某教师的教师姓名”）。
- **属性重命名**：除SELECT子句的结果列重命名外，也可在FROM子句中对表的属性重命名（较少用），核心目的均为提升查询语句的可读性和简洁性。


### 6. 字符串操作：匹配与处理文本数据
SQL提供针对字符型属性的专用操作，支持灵活的文本匹配和处理，核心功能围绕“模式匹配”展开：
- **通配符匹配（LIKE）**：用`like`关键字结合通配符实现模糊匹配，常用通配符包括：
  - `%`：匹配任意长度的子串（包括空串），例如`where name like '%dar%'`（匹配姓名中包含“dar”子串的教师，如“Darwin”“Edward”）；
  - `_`：匹配单个字符，例如`where name like 'J_n'`（匹配姓名为3个字符且首字母“J”、尾字母“n”的人，如“Jan”“Jon”）。
- **转义字符（ESCAPE）**：当需匹配的文本中包含通配符（如`%`“Main%”）时，需用`escape`指定转义字符，例如`where name like 'Main\%' escape '\'`（`\`为转义字符，此处匹配“Main%”字符串，而非“Main后接任意子串”）。
- **其他字符串函数**：SQL支持文本处理函数，例如`||`（字符串连接，如`'Name: ' || name`）、`upper()`/`lower()`（大小写转换）、`length()`（字符串长度）、`substring()`（提取子串）等，具体函数因数据库系统略有差异。


### 7. 结果排序（ORDER BY）：调整元组显示顺序
ORDER BY子句的核心作用是对查询结果按指定属性排序，支持单属性或多属性排序，默认按“升序（ASC）”排列，可显式指定“降序（DESC）”：
- **单属性排序**：格式为`order by 属性名 [ASC/DESC]`，例如`select distinct name from instructor order by name desc`（按姓名降序排列教师姓名）。
- **多属性排序**：按多个属性的优先级排序，优先级由前至后，例如`select dept_name, name from instructor order by dept_name, name`（先按部门名称升序排列，同一部门内按姓名升序排列），不同属性可指定不同排序方向（如`order by dept_name asc, salary desc`）。
- **注意事项**：ORDER BY仅影响“结果的显示顺序”，不改变关系本身的元组顺序（关系具有“无序性”特性）。


### 8. 重复（Duplication）处理：SQL的多集特性
SQL的核心特性之一是“允许关系（表）和查询结果中存在重复元组”，这与“纯关系代数要求元组唯一”不同，属于SQL查询基本结构的重要组成部分（非高级查询功能），具体包括：
- **默认行为**：SQL的表（关系）本质是“多集（Multiset）”，允许同一元组多次出现；查询结果默认保留所有重复元组（即`select all`的效果），仅当显式使用`distinct`时才删除重复。
- **多集版本的关系代数操作**：SQL的基本查询操作（选择、投影、笛卡尔积）均基于“多集”实现，与纯关系代数的“集合操作”有差异，例如：
  1. 选择操作（`σP(r)`）：若原多集`r`中有`c1`个元组`t1`且`t1`满足`P`，则结果中仍保留`c1`个`t1`；
  2. 投影操作（`ΠA(r)`）：若原多集`r`中有`c1`个元组`t1`，则结果中保留`c1`个“`t1`的投影元组”（例如`r1={(1,a),(2,a)}`，`ΠB(r1)`结果为`{(a),(a)}`）；
  3. 笛卡尔积（`r1 × r2`）：若`r1`有`c1`个`t1`、`r2`有`c2`个`t2`，则结果中有`c1×c2`个“`t1.t2`组合元组”（例如`r1={(1,a),(2,a)}`、`r2={(2),(3),(3)}`，`ΠB(r1) × r2`结果为`{(a,2),(a,2),(a,3),(a,3),(a,3),(a,3)}`）。
- **与DISTINCT/ALL的关联**：`distinct`本质是将“多集结果”转换为“集合结果”（删除重复），`all`则保留多集特性（默认），二者均属于重复处理的基础手段，需结合业务需求选择（如“提取所有部门名称”需去重，“统计每个教师的授课次数”需保留重复）。

## 四、高级查询特性
高级查询特性是在SQL基本查询结构基础上的功能扩展，用于解决复杂数据检索需求（如多结果集运算、数据统计、空值处理、嵌套逻辑等），核心目标是提升查询的灵活性与功能性，具体内容如下：


### 1. 集合操作：多结果集的组合与筛选
集合操作基于“关系是集合”的特性，对两个或多个查询结果集（需满足“属性数量一致、对应属性类型兼容”）执行“并、交、差”运算，分为“自动去重”和“保留重复”两类，适用于“合并多条件结果”“筛选交集/差集数据”场景：
- **基本操作（自动去重）**：执行运算后删除结果集中的重复元组，需对结果排序（性能略低），核心包括3类：
  - `UNION（并集）`：合并两个结果集，保留所有存在于任一集合的元组（去重），示例：  
    `(select course_id from section where semester = 'Fall' and year = 2009) union (select course_id from section where semester = 'Spring' and year = 2010)`（查询2009年秋季**或**2010年春季开设的课程，去重）；
  - `INTERSECT（交集）`：保留同时存在于两个结果集的元组（去重），示例：  
    `(select course_id from section where semester = 'Fall' and year = 2009) intersect (select course_id from section where semester = 'Spring' and year = 2010)`（查询2009年秋季**且**2010年春季开设的课程，去重）；
  - `EXCEPT（差集）`：保留“第一个结果集存在、第二个结果集不存在”的元组（去重），示例：  
    `(select course_id from section where semester = 'Fall' and year = 2009) except (select course_id from section where semester = 'Spring' and year = 2010)`（查询2009年秋季开设、但2010年春季未开设的课程，去重）。
- **多集操作（保留重复）**：执行运算后保留结果集中的重复元组，无需排序（性能更高），对应3类操作：`UNION ALL`（并集保重）、`INTERSECT ALL`（交集保重，仅保留两集合中重复次数一致的元组）、`EXCEPT ALL`（差集保重，按重复次数计算差值），示例：  
  若2009年秋季“CS-101”开设2次，2010年春季“CS-101”开设1次，则`(select course_id from section where semester='Fall' and year=2009) union all (select course_id ... Spring 2010)`的结果中“CS-101”会出现3次。
- **关键注意事项**：参与集合操作的结果集必须满足“结构兼容”——属性数量相同、对应属性的数据类型一致（如第一个结果集第1列是`varchar(8)`，第二个结果集第1列也需是字符串类型），否则会报错。


### 2. 聚合函数：数据统计与计算
聚合函数对“关系中某列的多值集合”执行统计运算，返回单个结果值，常用于“数据汇总”场景（如计算平均值、总数、最值等），结合`GROUP BY`可实现“分组统计”，结合`HAVING`可筛选分组结果：
- **常用聚合函数及功能**：
  | 函数名   | 功能描述                                                                 | 示例（基于instructor表）                          |
  |----------|--------------------------------------------------------------------------|---------------------------------------------------|
  | `AVG()`  | 计算某列（数值型）的平均值，自动忽略NULL值                               | `select avg(salary) from instructor where dept_name='Comp. Sci.'`（计算机系教师平均工资） |
  | `MIN()`  | 查找某列的最小值，支持数值、字符、日期类型（字符按字典序，日期按时间序） | `select min(salary) from instructor`（教师最低工资） |
  | `MAX()`  | 查找某列的最大值，类型支持同MIN()                                        | `select max(salary) from instructor where dept_name='Finance'`（财务系教师最高工资） |
  | `SUM()`  | 计算某列（数值型）的总和，自动忽略NULL值                                 | `select sum(salary) from instructor where dept_name='Biology'`（生物系教师工资总和） |
  | `COUNT()`| 统计“非NULL值的数量”，`COUNT(*)`统计所有元组数量（含NULL列的元组）        | `select count(distinct ID) from teaches where semester='Spring' and year=2010`（2010年春季授课的不重复教师数）；`select count(*) from course`（课程表总元组数） |
- **`GROUP BY`子句：分组统计**：  
  按指定属性（或属性组合）将关系划分为多个“分组”，对每个分组单独执行聚合函数，核心规则：**SELECT子句中，所有“非聚合函数的属性”必须出现在`GROUP BY`列表中**（确保每个分组的该属性值唯一，避免统计歧义）。  
  示例：`select dept_name, avg(salary) as avg_salary from instructor group by dept_name`（按部门分组，计算每个部门的教师平均工资）；  
  错误示例：`select dept_name, ID, avg(salary) from instructor group by dept_name`（ID未在`GROUP BY`中，同一部门有多个ID，无法确定返回哪个ID，会报错）。
- **`HAVING`子句：筛选分组结果**：  
  用于“过滤聚合函数计算后的分组”，与`WHERE`的核心区别在于**执行时机**：`WHERE`在“分组前”筛选元组（作用于单个元组），`HAVING`在“分组后”筛选分组（作用于聚合结果）。  
  示例：`select dept_name, avg(salary) from instructor group by dept_name having avg(salary) > 42000`（筛选平均工资超过42000的部门，先按部门分组算平均工资，再过滤分组）；  
  注意：`HAVING`子句中可使用聚合函数或`GROUP BY`中的属性，不可使用非分组、非聚合的属性（如上述示例中不能用`salary > 42000`，需用`avg(salary) > 42000`）。


### 3. 空值（NULL）处理：应对“未知/不存在”的数据
NULL表示“属性值未知”或“属性值不存在”（非“0”或空字符串），SQL对NULL的运算和判断有特殊规则，需避免因NULL导致的查询逻辑错误：
- **空值的核心特性**：  
  - 算术运算：任何包含NULL的算术表达式结果均为NULL，例如`5 + NULL = NULL`、`salary * 1.05 + NULL = NULL`；  
  - 比较运算：任何与NULL的比较结果均为“UNKNOWN”（既非TRUE也非FALSE），例如`salary = NULL`、`5 > NULL`的结果都是UNKNOWN，因此判断空值不能用`=`，必须用`IS NULL`。
- **三值逻辑：处理UNKNOWN结果**：  
  SQL的逻辑判断除“TRUE（真）”“FALSE（假）”外，新增“UNKNOWN（未知）”，用于处理含NULL的比较，核心规则：
  - `OR`（或）：只要有一个为TRUE，结果为TRUE；若有UNKNOWN且无TRUE，结果为UNKNOWN；均为FALSE则为FALSE，例如`TRUE OR UNKNOWN = TRUE`、`FALSE OR UNKNOWN = UNKNOWN`、`UNKNOWN OR UNKNOWN = UNKNOWN`；
  - `AND`（且）：只要有一个为FALSE，结果为FALSE；若有UNKNOWN且无FALSE，结果为UNKNOWN；均为TRUE则为TRUE，例如`TRUE AND UNKNOWN = UNKNOWN`、`FALSE AND UNKNOWN = FALSE`、`UNKNOWN AND UNKNOWN = UNKNOWN`；
  - `NOT`（非）：`NOT TRUE = FALSE`、`NOT FALSE = TRUE`、`NOT UNKNOWN = UNKNOWN`；  
  关键影响：`WHERE`子句仅保留“结果为TRUE”的元组，“UNKNOWN”和“FALSE”的元组都会被过滤，例如`where salary > 80000`会过滤掉“salary为NULL”的元组（因`salary > 80000`结果为UNKNOWN）。
- **空值检测与聚合函数处理**：  
  - 空值检测：用`IS NULL`（判断为空）或`IS NOT NULL`（判断非空），示例：`select name from instructor where salary is null`（查询工资为空的教师）；  
  - 聚合函数处理：除`COUNT(*)`外，所有聚合函数均自动忽略NULL值；若某分组的聚合列全为NULL，`COUNT()`返回0，其他函数（`AVG`/`SUM`/`MIN`/`MAX`）返回NULL，例如“某部门无教师（salary全为NULL）”，`avg(salary)`返回NULL，`count(salary)`返回0。


### 4. 嵌套子查询：复杂逻辑的分层实现
嵌套子查询是“在一个查询（外层查询）中包含另一个完整的SELECT-FROM-WHERE表达式（内层查询）”，内层查询的结果作为外层查询的“数据来源”或“判断条件”，适用于“需多步检索”的复杂场景，按子查询所在位置可分为4类：
- **WHERE子句中的子查询：作为筛选条件**  
  内层查询返回一个“单值集合”或“元组集合”，外层查询通过关键字判断“元组是否满足与该集合的关系”，核心用途包括：
  1. **集合成员检测（IN/NOT IN）**：判断外层元组的属性值是否在“内层查询结果集”中（`IN`）或不在（`NOT IN`），示例：  
     `select distinct course_id from section where semester='Fall' and year=2009 and course_id not in (select course_id from section where semester='Spring' and year=2010)`（2009年秋季开设、但2010年春季未开设的课程）；  
     注意：若内层查询结果含NULL，`NOT IN`可能返回空结果（因`NULL`导致三值逻辑的UNKNOWN），需谨慎使用。
  2. **集合比较（SOME/ALL）**：结合比较运算符（`>`/`<`/`>=`/`<=`/`=`/`!=`），判断外层属性值是否“满足与集合中某一个元素的比较（SOME）”或“满足与集合中所有元素的比较（ALL）”，示例：  
     - `select name from instructor where salary > some (select salary from instructor where dept_name='Biology')`（工资高于生物系**某一位**教师的教师姓名）；  
     - `select name from instructor where salary > all (select salary from instructor where dept_name='Biology')`（工资高于生物系**所有**教师的教师姓名）；  
     等价关系：`= SOME`等价于`IN`，`!= ALL`等价于`NOT IN`。
  3. **空关系检测（EXISTS/NOT EXISTS）**：判断“内层查询结果集是否非空（EXISTS）”或“为空（NOT EXISTS）”，无需关注内层查询返回的具体值（常用`select *`），且支持“相关子查询”（内层查询引用外层查询的属性），灵活性极高，示例：  
     - `select course_id from section as S where semester='Fall' and year=2009 and exists (select * from section as T where semester='Spring' and year=2010 and S.course_id=T.course_id)`（2009年秋季和2010年春季均开设的课程，S为外层表别名，T为内层表别名，通过`S.course_id=T.course_id`关联）；  
     - `select distinct S.ID, S.name from student as S where not exists ( (select course_id from course where dept_name='Biology') except (select T.course_id from takes as T where S.ID=T.ID) )`（选修了生物系所有课程的学生，利用“X except Y为空”等价于“X包含于Y”的逻辑）。
  4. **重复检测（UNIQUE）**：判断“内层查询结果集是否无重复元组”，返回TRUE（无重复）或FALSE（有重复），示例：  
     `select T.course_id from course as T where unique (select R.course_id from section as R where T.course_id=R.course_id and R.year=2009)`（2009年最多开设一次的课程，内层查询若返回重复的course_id，则UNIQUE为FALSE，该课程不被选中）。

- **FROM子句中的子查询：作为临时关系**  
  内层查询的结果集被视为一个“临时关系”（需指定别名，否则报错），外层查询从该临时关系中检索数据，适用于“需先对数据做预处理（如分组统计），再基于预处理结果查询”的场景，示例：  
  `select dept_name, avg_salary from (select dept_name, avg(salary) as avg_salary from instructor group by dept_name) as dept_avg where avg_salary > 42000`（查询平均工资超42000的部门，内层查询先按部门算平均工资，生成临时关系`dept_avg`，外层查询从`dept_avg`中筛选结果）；  
  注意：临时关系的别名是必需的（如上述`dept_avg`），用于在外层查询中引用该临时关系的属性（如`dept_avg.avg_salary`）。

- **WITH子句：定义可复用的临时关系**  
  `WITH`子句在查询开头定义一个或多个“临时关系”（仅在当前查询中有效，查询结束后销毁），避免重复编写相同的子查询，提升代码可读性，支持多临时关系（用逗号分隔），示例：  
  1. 单临时关系：`with max_budget (value) as (select max(budget) from department) select department.name from department, max_budget where department.budget = max_budget.value`（查询预算最高的部门，`max_budget`是临时关系，存储最高预算值）；  
  2. 多临时关系：`with dept_total (dept_name, value) as (select dept_name, sum(salary) from instructor group by dept_name), dept_total_avg(value) as (select avg(value) from dept_total) select dept_name from dept_total, dept_total_avg where dept_total.value > dept_total_avg.value`（查询总工资高于所有部门平均总工资的部门，先定义`dept_total`（各部门总工资）和`dept_total_avg`（平均总工资）两个临时关系，再筛选结果）。

- **SELECT子句中的标量子查询：返回单个值**  
  内层查询必须返回“单个值”（即结果集只有1行1列），作为外层查询SELECT子句的一个“属性值”，适用于“为每条外层元组附加一个基于其他表计算的值”的场景，示例：  
  `select dept_name, (select count(*) from instructor where department.dept_name = instructor.dept_name) as num_instructors from department`（查询每个部门及其对应的教师人数，内层查询为每个部门（外层`department.dept_name`）统计教师数量，返回单个值作为`num_instructors`列）；  
  注意：若标量子查询返回多行或多列，会触发运行时错误，需确保内层查询逻辑仅返回单个值（可通过`limit 1`或聚合函数保障）。

## 五、数据操纵语言（DML）
数据操纵语言（DML，Data Manipulation Language）是SQL中用于**修改数据库数据**的核心模块，不改变数据库结构（如表、属性定义），仅对表中的元组（行）执行“删除、插入、更新”操作，确保数据的动态维护，具体内容如下：


### 1. 删除操作（DELETE）：移除表中的元组
DELETE语句用于从指定表中删除符合条件的元组，若不指定条件则删除表中所有元组（保留表结构，仅清空数据），核心是“精准筛选待删数据，避免误删”。
- **基本语法**：  
  ```sql
  delete from 表名 [where 筛选条件];
  ```
  - 关键字说明：`from`指定待删除数据所在的表；`where`可选，用于筛选“需删除的元组”，无`where`时删除表中所有元组（需谨慎操作）。

- **典型示例与逻辑解析**：
  1. **删除表中所有元组**（清空数据，保留表结构）：  
     `delete from instructor;`  
     作用：删除`instructor`表中所有教师记录，表的属性（ID、name等）和约束（主键、外键等）仍保留，后续可重新插入数据。
  2. **按简单条件删除**（筛选特定属性值的元组）：  
     `delete from instructor where dept_name = 'Finance';`  
     作用：仅删除“所属部门为财务系（Finance）”的教师元组，其他部门的教师记录不受影响。
  3. **按关联条件删除**（结合子查询筛选关联表数据）：  
     `delete from instructor where dept_name in (select dept_name from department where building = 'Watson');`  
     作用：删除“所在部门位于Watson楼”的教师，逻辑分两步：先通过子查询找到`department`表中“building='Watson'”的部门名称，再删除`instructor`表中属于这些部门的教师元组。
  4. **按聚合条件删除**（结合子查询计算动态值筛选）：  
     `delete from instructor where salary < (select avg(salary) from instructor);`  
     作用：删除“工资低于教师平均工资”的元组，**关键机制**：SQL会先执行子查询计算`avg(salary)`（固定平均工资值），再基于该固定值筛选待删元组；若边删边重新计算平均工资，会导致结果不准确（删除过程中平均工资会动态上升），因此SQL默认“先计算条件值，再批量删除”。

- **关键注意事项**：  
  - DELETE仅删除元组，不删除表结构（与`DROP TABLE`不同，后者删除表结构和数据）；  
  - 若表存在外键约束，删除元组需满足外键规则（如关联表有引用时，需按`ON DELETE`规则处理，否则报错）。


### 2. 插入操作（INSERT）：向表中添加新元组
INSERT语句用于向指定表中插入新元组，支持“插入单个/多个指定值”“插入查询结果集”，核心是“确保插入数据符合表的属性类型和完整性约束”。
- **基本语法（两种核心形式）**：
  1. **不指定属性顺序**（需与表结构的属性顺序完全一致）：  
     ```sql
     insert into 表名 values(值1, 值2, ..., 值n);
     ```
     要求：`值1~值n`的数量、数据类型需与表的属性数量、类型一一对应（如`instructor`表属性顺序为ID、name、dept_name、salary，则插入值需按“ID值、姓名、部门、工资”顺序填写）。
  2. **指定属性顺序**（可灵活调整属性顺序，未指定的属性需允许NULL或有默认值）：  
     ```sql
     insert into 表名(属性1, 属性2, ..., 属性k) values(值1, 值2, ..., 值k);
     ```
     优势：无需记忆表的属性顺序，仅需为指定的`k`个属性提供对应值，未指定的属性若定义了“默认值”则取默认值，若允许NULL则为NULL（需符合表的约束，如`name`设为`not null`则必须指定并提供非NULL值）。

- **典型示例与特殊场景**：
  1. **插入单个元组（指定属性）**：  
     `insert into course(course_id, title, dept_name, credits) values('CS-437', 'Database Systems', 'Comp. Sci.', 4);`  
     作用：向`course`表插入“课程ID为CS-437、名称为数据库系统、所属计算机系、学分4”的课程记录，属性顺序与表结构无关，仅需保证“指定属性与值对应”。
  2. **插入含NULL的元组**（属性允许NULL时）：  
     `insert into student values('3003', 'Green', 'Finance', null);`  
     作用：向`student`表插入“学号3003、姓名Green、财务系、总学分（tot_cred）为NULL”的学生记录，因`tot_cred`未设`not null`，故可插入NULL（表示“总学分未统计”）。
  3. **插入查询结果集**（批量插入，将一个查询的结果作为新元组插入）：  
     `insert into student select ID, name, dept_name, 0 from instructor;`  
     作用：将`instructor`表中所有教师的“ID、name、dept_name”作为`student`表的“ID、name、dept_name”，并将`student`表的`tot_cred`设为0，批量插入学生记录。  
     关键规则：`select`的结果需与`insert`目标表的“属性数量、数据类型”兼容（如`select`返回4列，`student`表有4个属性，且对应列类型一致）；SQL会**先完整执行`select`获取所有结果，再批量插入**，避免“插入过程中查询结果变化”（如避免`insert into table1 select * from table1`的循环插入问题）。

- **关键注意事项**：  
  - 插入数据需符合表的完整性约束（如主键不重复、外键存在于关联表、`not null`属性非空），否则插入失败；  
  - 批量插入（如插入查询结果）时，需确保结果集与目标表结构兼容，避免数据类型不匹配。


### 3. 更新操作（UPDATE）：修改表中已有元组的属性值
UPDATE语句用于修改指定表中符合条件的元组的属性值，若不指定条件则更新表中所有元组的对应属性（需谨慎，避免全表误更新），核心是“精准定位待更新元组，灵活设置新值”。
- **基本语法**：  
  ```sql
  update 表名
  set 属性1 = 新值1, 属性2 = 新值2, ..., 属性k = 新值k
  [where 筛选条件];
  ```
  - 关键字说明：`set`指定“需更新的属性”及“对应的新值”（新值可是固定值、算术表达式、子查询结果）；`where`可选，筛选“需更新的元组”，无`where`时更新表中所有元组。

- **典型示例与进阶用法**：
  1. **按简单条件更新**（分批次更新不同元组）：  
     ```sql
     -- 工资>100000的教师涨3%
     update instructor set salary = salary * 1.03 where salary > 100000;
     -- 工资<=100000的教师涨5%
     update instructor set salary = salary * 1.05 where salary <= 100000;
     ```
     作用：分两次更新教师工资，需注意“更新顺序”——若先更新低工资再更新高工资，不会影响结果（因高工资条件`salary>100000`在第一次更新中未被触发）；但可通过`CASE`语句优化为单次更新，更高效。
  2. **用CASE语句实现条件更新**（单次更新多条件场景）：  
     ```sql
     update instructor
     set salary = case
                     when salary <= 100000 then salary * 1.05  -- 低工资涨5%
                     else salary * 1.03                       -- 高工资涨3%
                 end;
     ```
     优势：无需分两次执行，通过`CASE`语句在单次更新中按条件设置不同新值，减少SQL执行次数，避免漏更或重复更新。
  3. **标量子查询更新**（基于其他表的计算结果更新）：  
     ```sql
     update student S
     set tot_cred = (
         select case
                    when sum(credits) is not null then sum(credits)  -- 有选课记录则求和
                    else 0                                           -- 无选课记录设为0
                end
         from takes T, course C
         where T.course_id = C.course_id  -- 关联选课表与课程表，获取学分
           and S.ID = T.ID                -- 关联学生表与选课表，匹配当前学生
           and T.grade <> 'F'             -- 排除不及格课程
           and T.grade is not null        -- 排除成绩为空的课程
     );
     ```
     作用：重新计算每个学生的总学分（`tot_cred`），逻辑分三步：  
     ① 对每个学生（`S.ID`），通过子查询关联`takes`（选课记录）和`course`（课程学分）；  
     ② 筛选“成绩非F且非空”的课程，求和学分；  
     ③ 用`CASE`处理“无选课记录（sum(credits)为NULL）”的情况，设为0，避免`tot_cred`被更新为NULL。

- **关键注意事项**：  
  - `where`条件是“精准更新”的核心，若遗漏则会更新表中所有元组（如`update instructor set salary = salary * 1.05`会让所有教师工资涨5%，需谨慎）；  
  - 标量子查询需返回“单个值”（1行1列），否则会触发运行时错误；若子查询可能返回NULL，需用`CASE`或`IFNULL`处理，确保更新值符合表约束。

## 六、索引
索引是数据库中用于**提升查询效率**的辅助数据结构，通过对表中特定属性（或属性组合）建立有序映射，避免查询时的“全表扫描”，快速定位符合条件的元组；同时，唯一索引还能辅助保障数据完整性（防止属性值重复）。核心操作包括“索引创建”和“索引删除”，具体内容如下：


### 1. 索引创建（CREATE INDEX）
通过`CREATE INDEX`语句创建索引，根据功能需求可分为“普通索引”和“唯一索引”，需指定索引名、目标表及索引对应的属性（可设置排序方式）。
- **基本语法框架**：  
  ```sql
  CREATE [UNIQUE] INDEX 索引名 ON 表名(属性1 [ASC/DESC], 属性2 [ASC/DESC], ...);
  ```
  - 关键字说明：`UNIQUE`（可选）表示“唯一索引”，无则为“普通索引”；`ASC`（默认，可省略）表示属性按升序排序，`DESC`表示按降序排序；索引名需唯一，避免与其他索引重名。

- **两类核心索引及示例解析**：
  1. **普通索引**：仅用于加速查询，不限制属性值的唯一性（允许重复值），适用于“频繁作为查询条件、但值可重复”的属性。  
     示例：`CREATE INDEX H_INDEX ON STUDENT(HEIGHT);`  
     解析：  
     - 索引名：`H_INDEX`（自定义，需见名知意，此处为“学生身高索引”）；  
     - 目标表：`STUDENT`（对学生表建立索引）；  
     - 索引属性：`HEIGHT`（基于“身高”属性建立索引）；  
     - 作用：当执行`SELECT * FROM STUDENT WHERE HEIGHT > 180`这类查询时，数据库可通过`H_INDEX`快速定位身高超180的学生，无需扫描全表。

  2. **唯一索引**：除加速查询外，还强制要求“索引对应的属性（或属性组合）值唯一”，若插入/更新导致值重复，会触发错误，适用于“需唯一标识、且频繁查询”的属性（如主键的辅助索引，主键默认自带唯一索引）。  
     示例：`CREATE UNIQUE INDEX SC_INDEX ON SC(SNO ASC, CNO DESC);`  
     解析：  
     - 索引名：`SC_INDEX`（针对“学生选课表（SC）”的索引）；  
     - 目标表：`SC`（选课表，存储学生编号（SNO）、课程编号（CNO）等信息）；  
     - 索引属性及排序：`SNO ASC`（学生编号按升序）、`CNO DESC`（课程编号按降序），属于“组合唯一索引”；  
     - 核心作用：① 加速“按SNO和CNO查询”的语句（如`SELECT * FROM SC WHERE SNO='2023001' AND CNO='CS-101'`）；② 强制“同一学生（SNO）不能选同一课程（CNO）”（因索引唯一，重复的SNO+CNO组合无法插入），辅助保障选课数据的完整性。


### 2. 索引删除（DROP INDEX）
当索引不再需要（如属性查询频率降低、表结构变更）时，通过`DROP INDEX`语句删除索引，删除后仅移除索引结构，不影响表本身的数据及结构。
- **基本语法**：  
  ```sql
  DROP INDEX 索引名;
  ```
  - 示例：`DROP INDEX H_INDEX;`  
    解析：删除名为`H_INDEX`的索引，删除后：① 针对`STUDENT`表`HEIGHT`属性的查询将不再通过该索引加速（可能恢复全表扫描）；② 若`H_INDEX`是普通索引，`HEIGHT`属性的值仍可重复（删除索引不改变数据本身）。

- **关键注意事项**：  
  - 索引删除不可逆，需确认索引不再使用后执行；  
  - 删除索引不会影响表的数据和表结构，仅移除索引的辅助映射；  
  - 若索引是“唯一索引”，删除后其“值唯一”的约束也会消失（如需继续保障唯一性，需通过`UNIQUE`约束或主键约束实现）。