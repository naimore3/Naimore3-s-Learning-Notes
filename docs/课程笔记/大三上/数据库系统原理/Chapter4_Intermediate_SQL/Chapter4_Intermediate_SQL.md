# Chapter4: Intermediate SQL
## 连接表达式（Join Expressions）

### 连接关系概述
- 连接操作核心：接收两个关系作为输入，返回一个新关系，本质是带匹配条件的笛卡尔积变体。
- 匹配规则：要求两个关系中的元组满足指定匹配条件，同时明确结果中包含的属性。
- 使用场景：通常作为 `from` 子句中的子查询表达式使用。
- 示例基础关系：
  - `course` 表：存储课程编号、名称、所属部门、学分等课程信息。
  - `prereq` 表：存储课程编号与先修课程编号的对应关系。
  - 数据特点：CS-315 课程缺少先修课程信息，CS-347 先修课程缺少对应课程信息。

### 自然连接（Natural Join）
- 核心逻辑：自动根据两个关系中的同名属性进行匹配连接。
- 典型语法：
  1. `select * from course natural join prereq`
  2. 等价写法：`select * from course join prereq on course.course_id = prereq.course_id`
- 结果特征：仅保留同名属性匹配成功的元组，同名属性会合并为一列。

### 自然连接的风险
- 核心风险：无关但同名的属性会被错误等价匹配，导致结果偏差。
- 示例场景：查询学生姓名与所选课程标题。
  - 正确写法：`select name, title from student natural join takes, course where takes.course_id = course.course_id`
  - 错误写法：`select name, title from student natural join takes natural join course`
  - 错误后果：遗漏学生跨自身所在部门选课的（姓名-课程标题）组合。

### Using 子句
- 核心作用：明确指定用于匹配的属性，避免自然连接中同名属性的错误匹配。
- 语法示例：`select name, title from (student natural join takes) join course using (course_id)`
- 优势：精准控制连接条件，仅对指定属性进行匹配，提升查询准确性。

### On 条件
- 核心功能：支持在连接时使用通用谓词，灵活定义匹配规则。
- 语法特点：谓词写法类似 `where` 子句，需使用 `on` 关键字引导。
- 示例语法：`select * from student join takes on student.ID = takes.ID`
- 等价转换：`select * from student, takes where student.ID = takes.ID`（传统多表查询写法）

### 外部连接（Outer Join）
- 核心优势：解决普通连接丢失不匹配数据的问题，保留未匹配元组并以 `null` 填充缺失属性。
- 分类及用法：
  1. 左外连接（Left Outer Join）：保留左表所有元组，右表无匹配时填充 `null`，语法：`select * from course natural left outer join prereq`。
  2. 右外连接（Right Outer Join）：保留右表所有元组，左表无匹配时填充 `null`，语法：`select * from course natural right outer join prereq`。
  3. 全外连接（Full Outer Join）：保留两个表所有元组，无匹配时均填充 `null`，语法：`select * from course natural full outer join prereq`。

### 连接类型与条件
- 连接类型（Join Type）：定义无匹配元组的处理方式，包括内连接（inner join）、左外连接、右外连接、全外连接。
- 连接条件（Join Condition）：定义元组匹配规则，支持三种形式：`natural`（自动同名属性匹配）、`on <predicate>`（通用谓词）、`using (A1, A2, ..., An)`（指定匹配属性）。

### 连接示例
- 内连接带 `on` 条件：`course inner join prereq on course.course_id = prereq.course_id`
- 左外连接带 `on` 条件：`course left outer join prereq on course.course_id = prereq.course_id`
- 自然右外连接：`course natural right outer join prereq`
- 全外连接带 `using` 子句：`course full outer join prereq using (course_id)`

### 问题示例解析
- 基础关系：学生（学号，姓名，年龄，班级，系别）、选课（学号，课程编号，课程名称，成绩）。
- 查询语句：`SELECT * FROM 选课 RIGHT OUTER JOIN 学生 ON 选课.学号 = 学生.学号`
- 结果结论：返回所有学生的基本信息及其选课信息，未选课的学生信息也会保留（对应选项B）。

## 视图（Views）

### 视图的核心作用
- **数据隐藏与权限控制**：避免所有用户直接访问数据库的完整逻辑模型（实际存储的关系），仅向特定用户展示所需数据。  
  示例：仅向部分用户展示教师的ID、姓名和所属部门，隐藏敏感的薪资信息，对应查询逻辑为 `select ID, name, dept_name from instructor`。
- **虚拟关系属性**：视图并非数据库中实际存储的关系（非概念模型组成部分），而是通过查询表达式生成的“虚拟关系”，仅在使用时动态计算结果。


### 视图的定义规则
- **基础语法**：使用 `create view` 语句定义，格式为：  
  `create view <视图名> as <合法SQL查询表达式>`  
  其中，`<查询表达式>` 可包含 select、from、where、group by 等常规SQL子句。
- **使用特性**：
  - 视图定义仅保存查询表达式，不存储实际数据（除非是物化视图）。
  - 后续查询中引用视图名时，数据库会自动将视图名“替换”为其定义的查询表达式，再执行最终查询。


### 视图示例
#### 示例1：无薪资的教师视图
- **创建语句**：  
  `create view faculty as select ID, name, dept_name from instructor;`  
- **查询用法**：通过视图筛选特定部门教师，如查询生物系教师姓名：  
  `select name from faculty where dept_name = 'Biology';`

#### 示例2：部门薪资总和视图
- **创建语句**（指定视图列名）：  
  `create view departments_total_salary(dept_name, total_salary) as select dept_name, sum(salary) from instructor group by dept_name;`  
- **功能**：动态计算各部门教师的薪资总和，无需手动重复执行聚合查询。


### 基于其他视图定义新视图
- **核心逻辑**：允许将已定义的视图作为“基础关系”，嵌套定义新视图，实现查询逻辑的分层复用。
- **示例**：
  1. 先定义“2009年秋季物理系课程”视图：  
     `create view physics_fall_2009 as select course.course_id, sec_id, building, room_number from course, section where course.course_id = section.course_id and course.dept_name = 'Physics' and section.semester = 'Fall' and section.year = '2009';`  
  2. 再基于该视图定义“2009年秋季物理系Watson楼课程”视图：  
     `create view physics_fall_2009_watson as select course_id, room_number from physics_fall_2009 where building = 'Watson';`


### 视图依赖与视图扩展
#### 1. 视图依赖类型
- **直接依赖**：若视图v1的定义中引用了视图v2，则v1“直接依赖”于v2。  
- **间接依赖**：若v1依赖于v2，v2又依赖于v3，则v1“间接依赖”于v3（存在依赖路径）。  
- **递归依赖**：若视图依赖于自身（如定义中引用自身），则为“递归视图”（需特殊处理，普通SQL场景较少见）。

#### 2. 视图扩展
- **定义**：将查询中引用的视图，替换为其原始查询表达式的过程，直到查询中不再包含任何视图名。  
- **终止条件**：只要视图定义非递归，替换过程会最终终止。  
- **示例**：上述 `physics_fall_2009_watson` 视图扩展后：  
  `create view physics_fall_2009_watson as select course_id, room_number from (select course.course_id, sec_id, building, room_number from course, section where course.course_id = section.course_id and course.dept_name = 'Physics' and section.semester = 'Fall' and section.year = '2009') where building = 'Watson';`


### 视图的更新操作
#### 1. 可正常更新的场景
- 若视图基于单表且无复杂逻辑（如无聚合、join），更新视图会同步映射到基础表。  
  示例：向 `faculty` 视图插入数据：  
  `insert into faculty values ('30765', 'Green', 'Music');`  
  实际执行：向基础表 `instructor` 插入元组 `('30765', 'Green', 'Music', null)`（薪资字段无值，补为null）。

#### 2. 无法唯一翻译的更新（不可更新场景）
- **歧义示例**：定义关联两张表的视图 `instructor_info`：  
  `create view instructor_info as select ID, name, building from instructor, department where instructor.dept_name = department.dept_name;`  
  若执行插入：`insert into instructor_info values ('69987', 'White', 'Taylor');`  
  会产生歧义：无法确定“Taylor”楼对应的具体部门（可能多个部门在该楼，或无部门在该楼），导致更新无法执行。

#### 3. SQL对可更新视图的限制
仅允许对“简单视图”执行更新，需满足以下所有条件：  
- 视图的 `from` 子句仅包含一个基础关系（表，非其他视图）。  
- `select` 子句仅包含基础关系的属性名，无表达式、聚合函数（如sum）或 `distinct` 关键字。  
- 未在 `select` 中列出的属性，允许被设为null（无 `not null` 约束）。  
- 视图定义中无 `group by` 或 `having` 子句。


### 历史教师视图的更新冲突示例
- **视图定义**：`create view history_instructors as select * from instructor where dept_name = 'History';`  
- **更新问题**：若向该视图插入元组 `('25566', 'Brown', 'Biology', 100000)`（属于生物系），虽语法可执行，但会导致基础表 `instructor` 中出现“部门为Biology却被历史系视图引用”的矛盾，违反视图的逻辑筛选条件。


### 物化视图（Materialized Views）
- **与普通视图的核心区别**：普通视图仅保存查询表达式，物化视图会**物理存储**查询结果（生成实际表）。  
- **数据一致性维护**：当基础关系（如 `instructor`）的数据更新时，物化视图的结果会“过时”，需通过“视图维护”机制同步更新（如自动刷新或手动触发刷新），确保数据准确性。  
- **适用场景**：适用于查询频率高、计算成本高（如复杂聚合）的场景，通过预存储结果提升查询效率。

## 事务（Transactions）

### 事务的核心定义与关键特性
- **本质定位**：事务是数据库操作中的**基本工作单元**，包含一系列SQL操作（如查询、插入、更新、删除），这些操作共同完成一个完整的业务逻辑（例如“转账”包含“扣款”和“收款”两步操作）。
- **原子性（Atomicity）**：事务具有“原子事务”特性，即事务中的所有操作要么**完全执行成功**（所有步骤都完成），要么**完全回滚**（若某一步失败，所有已执行的操作都会撤销，数据库恢复到事务开始前的状态，如同事务从未发生）。
- **隔离性（Isolation）**：事务在并发执行时，会与其他并发事务相互隔离，一个事务的执行过程和结果不会被其他未完成的事务干扰，避免因并发操作导致的数据不一致（如脏读、不可重复读等问题）。


### 事务的生命周期与管理机制
- **事务的开始**：事务采用**隐式开始**方式，无需显式声明“开始事务”的语句。当用户执行第一条SQL操作（如select、insert）时，事务会自动启动。
- **事务的结束**：事务需通过显式语句结束，有两种核心方式：
  1. **提交事务（commit work）**：将事务中所有已执行的操作永久保存到数据库，事务正常结束，数据变更生效。
  2. **回滚事务（rollback work）**：撤销事务中所有已执行的操作，数据库恢复到事务开始前的状态，事务异常结束。
- **默认自动提交机制**：大多数数据库（如MySQL、Oracle）默认开启“自动提交”模式，即**每个独立的SQL语句都会被视为一个单独的事务**，语句执行完成后自动触发commit work，无需用户手动提交。
- **自动提交的关闭方式**：可通过数据库API（如JDBC、ODBC）或数据库命令（如MySQL的`set autocommit = 0`）关闭自动提交模式，此时需用户手动执行commit work或rollback work来结束事务。
- **SQL标准与数据库支持差异**：SQL:1999标准中定义了`begin atomic ... end`语法，用于显式包裹事务内的操作块，但目前**大多数数据库（如MySQL、PostgreSQL）并不支持该语法**，实际应用中仍以“隐式开始+手动提交/回滚”为主。

## 完整性约束（Integrity Constraints）

### 完整性约束的核心作用
完整性约束是数据库系统的“防护机制”，核心目标是**防止数据库因意外操作或错误变更导致数据不一致**，确保授权用户对数据库的修改不会破坏数据的逻辑正确性。  
典型应用示例：

- 业务规则约束：检查账户余额需大于 $10,000.00（避免负余额或过低余额）、银行员工时薪不低于 $4.00（符合最低工资标准）。
- 数据有效性约束：客户的联系电话字段不可为空（`not null`），确保每个客户都有可联系的方式。


### 单关系约束（约束作用于单个表）
单关系约束仅针对某一个数据库表中的数据进行规则限制，主要包含以下四类：

#### 1. NOT NULL 约束
- **作用**：强制指定字段的值不能为 `null`（即必须填写具体数据），避免字段缺失关键信息。
- **语法示例**：定义部门表时，要求“部门名称”和“预算”必须有值：  
  `name varchar(20) not null, budget numeric(12,2) not null`


#### 2. PRIMARY KEY 约束（主键约束）
- **作用**：指定表中的一个或多个字段作为“主键”，用于唯一标识表中的每一条元组（记录），且主键字段的值**不可重复、不可为 null**。
- **隐含规则**：主键自动具备 `unique` 和 `not null` 的特性，是表中数据的“唯一身份标识”（如学生表的“学号”、课程表的“课程编号”）。


#### 3. UNIQUE 约束（唯一约束）
- **作用**：指定字段或字段组合的值必须唯一（不可重复），但与主键不同的是，`unique` 约束的字段**允许为 null**（null 不视为重复值）。
- **本质**：`unique (A1, A2, ..., Am)` 定义的字段组合是表的“候选键”——即具备唯一标识元组的能力，但未被指定为主键。
- **示例**：员工表中“工号”设为主键，“身份证号”可设为 `unique`（确保每个员工身份证号唯一，但允许暂未录入时为 null）。


#### 4. CHECK 子句（条件约束）
- **作用**：通过自定义谓词（条件表达式）`P`，限制字段值必须满足 `P` 的逻辑要求，仅允许符合条件的数据存入表中。
- **语法示例**：定义课程章节表时，限制“学期”只能是“秋、冬、春、夏”四季：  
  ```sql
  create table section (
      course_id varchar(8),
      sec_id varchar(8),
      semester varchar(6),
      year numeric(4,0),
      primary key (course_id, sec_id, semester, year),
      check (semester in ('Fall', 'Winter', 'Spring', 'Summer')) -- 仅允许指定学期值
  );
  ```
- **逻辑**：若插入或更新数据时，字段值不满足 `check` 中的谓词，数据库会拒绝该操作。


### 参照完整性（跨关系约束）
参照完整性用于维护**两个表之间的数据一致性**，确保“从表”中引用的字段值，在“主表”的对应主键字段中一定存在（避免引用不存在的数据）。

#### 1. 核心定义
- 设表 `R`（从表）包含字段组 `A`，表 `S`（主表）的主键为 `A`，则 `A` 是 `R` 的“外键”（foreign key），需满足：`R` 中所有 `A` 的值，要么为 `null`，要么在 `S` 的主键 `A` 中存在。
- **示例**：`instructor` 表（从表）的 `dept_name` 字段引用 `department` 表（主表）的主键 `dept_name`，则 `instructor` 中出现的“部门名称”（如“Biology”），必须在 `department` 表中存在对应的部门记录。


#### 2. 参照完整性的级联动作
当主表中的主键值被修改（`update`）或删除（`delete`）时，从表中引用该值的外键可能会变成“无效引用”，此时需通过“级联动作”处理，常见动作包括：

- **ON DELETE CASCADE**：删除主表记录时，自动删除从表中所有引用该主键的记录（如删除某部门时，自动删除该部门的所有教师记录）。
- **ON UPDATE CASCADE**：更新主表主键值时，自动更新从表中所有引用该主键的外键值（如修改部门名称时，自动同步更新教师表中该部门的名称）。
- **ON DELETE SET NULL / ON DELETE SET DEFAULT**：删除主表记录时，将从表中对应的外键值设为 `null` 或默认值（需确保外键字段允许为 `null` 或有默认值）。

- **语法示例**：定义课程表时，设置外键级联动作：  
  ```sql
  create table course (
      course_id char(5) primary key,
      title varchar(20),
      dept_name varchar(20),
      foreign key (dept_name) references department -- 外键引用部门表
          on delete cascade -- 部门删除时，级联删除对应课程
          on update cascade -- 部门名称更新时，级联更新课程的部门名称
  );
  ```


### 事务中的完整性约束违反与解决方案
在事务执行过程中，若操作触发完整性约束（如外键引用不存在的值），会导致事务执行失败，需通过合理方式规避。

#### 典型问题示例
定义 `person` 表，其中“父亲”“母亲”字段引用自身主键“ID”（自引用外键）：  
```sql
create table person (
    ID char(10),
    name char(40),
    mother char(10),
    father char(10),
    primary key (ID),
    foreign key (mother) references person, -- 引用自身ID
    foreign key (father) references person  -- 引用自身ID
);
```
若直接插入某个人的记录（其父母记录尚未插入），会因“父母ID不存在”违反外键约束。


#### 解决方案
1. **先插入依赖记录**：先插入该人的父母记录，再插入此人记录（确保外键引用的主键已存在）。
2. **初始设 null 后更新**：若“父亲”“母亲”字段允许为 `null`，可先插入此人记录（父母字段设为 `null`），待父母记录插入后，再通过 `update` 语句补全父母ID。
3. **延迟约束检查**：部分数据库支持“延迟约束检查”，将约束检查推迟到事务提交时（而非每条语句执行时），确保事务内所有相关记录插入完成后再验证约束。


### 复杂 CHECK 子句的限制与替代方案
#### 1. 复杂 CHECK 子句的限制
若 `check` 子句中包含子查询（如引用其他表的数据），大多数数据库（如MySQL、Oracle）**不支持该语法**。例如：  
`check (time_slot_id in (select time_slot_id from time_slot))`  
（意图：确保章节表的“时间段ID”在时间段表中存在）——该语句会因“子查询在 check 中”被数据库拒绝。


#### 2. 替代方案
- **触发器（Trigger）**：通过自定义触发器，在插入/更新数据时执行子查询校验逻辑，替代 `check` 子句的复杂条件（触发器将在后续章节详细讲解）。
- **CREATE ASSERTION（不推荐）**：SQL标准中定义 `create assertion <断言名> check <谓词>` 用于全局约束，但目前**几乎所有数据库都不支持该语法**，无法实际应用。

## SQL 数据类型和模式（SQL Data Types and Schemas）

### 一、内置数据类型（Built-in Data Types）
内置数据类型是SQL标准定义的基础数据格式，覆盖日期、时间、时间间隔等常见场景，支持直接用于表结构定义，核心类型及特性如下：

- **date（日期类型）**：存储年、月、日，格式为`'YYYY-MM-DD'`，示例：`date '2005-7-27'`（代表2005年7月27日）。
- **time（时间类型）**：存储时、分、秒，支持毫秒精度，格式为`'HH:MM:SS'`或`'HH:MM:SS.fff'`，示例：`time '09:00:30'`（无毫秒）、`time '09:00:30.75'`（含750毫秒）。
- **timestamp（时间戳类型）**：组合日期与时间，同时包含年、月、日、时、分、秒（支持毫秒），格式为`'YYYY-MM-DD HH:MM:SS.fff'`，示例：`timestamp '2005-7-27 09:00:30.75'`。
- **interval（时间间隔类型）**：表示一段连续时间，需指定单位，示例：`interval '1' day`（1天）、`interval '30' minute`（30分钟）。
- **运算规则**：日期/时间/timestamp类型间的差值运算返回interval类型（如`date '2024-5-1' - date '2024-4-28' = interval '3' day`）；interval类型可与日期/时间/timestamp类型相加（如`timestamp '2024-5-1 00:00:00' + interval '2' hour = timestamp '2024-5-1 02:00:00'`）。


### 二、索引创建（Index Creation）
索引是优化数据库查询效率的数据结构，通过对指定列建立索引，可快速定位目标记录，避免全表扫描，核心特性如下：

- **核心作用**：加速“基于索引列的查询”（如按ID查询、按关键字筛选），尤其适用于数据量较大的表。
- **语法格式**：`create index <索引名> on <表名>(<列名>);`
- **示例**：对`student`表的`ID`列创建索引，语句为`create index studentID_index on student(ID);`。当执行`select * from student where ID = '12345'`时，数据库可通过该索引直接定位记录，无需遍历所有学生数据。


### 三、用户定义类型（User-Defined Types）
用户可基于SQL内置类型自定义新类型，增强数据语义的明确性（如区分“金额”“温度”等特殊数值），核心规则如下：

- **语法格式**：`create type <自定义类型名> as <内置类型> final;`（`final`表示类型不可继承，部分数据库支持省略）。
- **示例**：定义“金额类型”`Dollars`（适配货币精度需求），语句为`create type Dollars as numeric(12,2) final;`；在表中使用该类型：`create table department(dept_name varchar(20), building varchar(15), budget Dollars);`，其中`budget`字段明确为“金额”，语义更清晰。


### 四、域（Domains）
域是对数据格式与约束的封装，侧重“约束规则复用”，支持直接附加`not null`、`check`等约束，与用户定义类型的核心区别是“非强类型”，具体特性如下：

- **语法格式**：
  - 基础域（带`not null`）：`create domain <域名> <内置类型> [not null];`
  - 带`check`约束的域：`create domain <域名> <内置类型> constraint <约束名> check (<约束条件>);`
- **示例**：
  1. 定义“人员姓名域”：`create domain person_name char(20) not null;`（限制姓名为20位字符且不可为空）。
  2. 定义“学历等级域”：`create domain degree_level varchar(10) constraint degree_level_test check (value in ('Bachelors', 'Masters', 'Doctorate'));`（限制学历仅为学士、硕士、博士）。
- **关键特性**：域仅校验数据格式与约束，不具备严格的类型区分（基于同一内置类型的不同域可隐式转换）。


### 五、大对象类型（Large-Object Types）
用于存储超出常规字段长度的数据（如照片、视频、超长文档），SQL提供两种核心类型，核心特性如下：

- **blob（二进制大对象）**：存储无结构二进制数据（如图片、视频、压缩文件），数据库不解析内容，仅以二进制流存储。
- **clob（字符大对象）**：存储结构化字符数据（如超长文本、XML/JSON文档），支持字符编码识别（如UTF-8）。
- **访问特性**：查询大对象字段时，数据库默认返回“数据指针”（而非完整数据），避免超大数据传输导致的查询效率下降。


### 六、唯一键生成（Generating Unique Key Values）
通过`generated always as identity`语法实现字段值的自动生成与唯一性保证，常用于主键（如ID）的自动赋值，核心规则如下：

- **语法格式**：`<字段名> <数值类型> generated always as identity;`
- **示例**：定义`student`表的`ID`字段为自动生成的5位唯一值：`create table student(ID number(5) generated always as identity, name varchar(20));`。插入数据时无需手动指定`ID`，数据库会自动生成从初始值（默认1）开始的连续唯一值，避免重复。


### 七、表创建变体与模式层级（Other Schema Features）
#### 1. 表结构复制（`create table ... like ...`）
- **作用**：复制现有表的结构（含字段名、数据类型、约束），但不复制数据。
- **示例**：`create table student_copy like student;`（创建`student_copy`表，结构与`student`完全一致，无数据）。

#### 2. 基于查询结果创建表（`create table ... as (...) with data`）
- **作用**：根据SQL查询结果创建新表，并将查询结果直接作为新表数据。
- **示例**：`create table biology_student as (select * from student where dept_name = 'Biology') with data;`（创建“生物系学生表”，结构与`student`一致，数据为生物系学生记录）。

#### 3. 模式、目录、环境
- **模式（Schema）**：表的“逻辑分组”，用于区分不同业务模块的表（如`school`模式含`student`/`instructor`表，`finance`模式含`salary`/`budget`表），避免表名冲突。
- **目录（Catalog）**：模式的“物理分组”，通常对应数据库实例中的一个“数据库”，一个目录可包含多个模式。
- **环境（Environment）**：用户的“访问上下文”，定义默认目录与模式，无需每次查询都指定“目录.模式.表”路径（如默认目录`school_db`、默认模式`school`，查询`student`表可简写为`select * from student`）。

## 授权（Authorization）

### 一、授权的核心形式
授权的本质是控制用户对数据库资源的访问与修改权限，避免未授权操作破坏数据安全性或完整性，主要分为“数据操作权限”和“模式修改权限”两类：

- **数据库数据操作权限**：针对表、视图等数据对象的读写操作，包括4种核心权限：
  - `read`：允许读取数据（如执行`select`查询），仅查看不修改；
  - `insert`：允许插入新数据（如执行`insert`语句），不允许修改已有数据；
  - `update`：允许修改已有数据（如执行`update`语句），不允许删除数据；
  - `delete`：允许删除已有数据（如执行`delete`语句），不允许插入或修改数据。
- **数据库模式修改权限**：针对数据库结构（表、索引等）的调整操作，包括4种核心权限：
  - `index`：允许为表创建或删除索引（如`create index`、`drop index`）；
  - `resources`：允许创建新的关系（表），是“建表”的基础权限；
  - `alteration`：允许修改已有表的结构（如添加/删除列，执行`alter table`）；
  - `drop`：允许删除已有关系（表、视图等），执行`drop table`或`drop view`。


### 二、授权规范（Grant 语句）
通过`grant`语句明确授予权限，需指定“权限范围”“操作对象”和“授权对象”，核心规则与语法如下：

- **基础语法**：  
  `grant <privilege list> on <relation/view name> to <user list>;`
- **参数说明**：
  - `<privilege list>`：单个或多个权限（如`select, insert`），或用`all privileges`表示“该对象的所有允许权限”；
  - `<relation/view name>`：权限对应的操作对象（表或视图）；
  - `<user list>`：被授权的对象，支持三类：
    1. 具体用户ID（如`U1`、`Amit`）；
    2. `public`：所有合法用户（权限对全体开放）；
    3. 角色（如`instructor`，后续“角色管理”章节详细说明）。
- **关键规则**：  
  视图授权不隐含基础关系授权——若授予用户“视图的`select`权限”，仅允许用户查询该视图，不代表用户可访问视图依赖的基础表（如授予`geo_instructor`视图权限，不隐含`instructor`表权限）。


### 三、SQL 中的具体特权类型
#### 1. 常用数据操作特权
- `select`：最基础的查询权限，允许读取表或视图的数据，是`select`语句的执行前提。  
  示例：授予`U1`、`U2`、`U3`查询`instructor`表的权限：  
  `grant select on instructor to U1, U2, U3;`
- `insert`：允许向表中插入新元组，可指定列（如`grant insert (name, dept_name) on instructor to U1`，仅允许插入姓名和部门列）。
- `update`：允许修改表中数据，可指定列（如`grant update (salary) on instructor to U2`，仅允许修改薪资）。
- `delete`：允许删除表中整行数据，无列级限制。
#### 2. 特权简写：`all privileges`
当需授予“某对象的所有权限”时，用`all privileges`简化语句。  
示例：给所有用户授予`student`表的所有权限：  
`grant all privileges on student to public;`


### 四、授权的撤销（Revoke 语句）
通过`revoke`语句收回已授予的权限，确保权限管理的灵活性（如用户离职后回收权限），核心规则与语法如下：

- **基础语法**：  
  `revoke <privilege list> on <relation/view name> from <user list>;`
- **关键规则与示例**：
  - 撤销所有权限：用`all`表示“撤销该用户在该对象上的所有权限”，示例：  
    `revoke all on branch from U1, U2, U3;`（收回`U1-U3`对`branch`表的所有权限）；
  - `public`的撤销：若之前用`public`授予权限，撤销时指定`public`，则所有用户失去该权限（除非有单独授予的权限）；
  - 依赖特权的级联撤销：若用户`U1`将权限授予`U2`，当撤销`U1`的权限时，`U2`从`U1`继承的权限会被自动撤销（权限传递链断裂）。


### 五、角色（Roles）管理
角色是“一组权限的集合”，用于简化批量权限管理（如给“教师”角色绑定统一权限，再授予多个用户），核心操作如下：
#### 1. 角色的基础操作
- **创建角色**：`create role <role name>;`  
  示例：创建“教师角色”`instructor`：  
  `create role instructor;`
- **给角色授予权限**：将权限绑定到角色，示例：  
  `grant select on takes to instructor;`（给`instructor`角色授予查询`takes`表的权限）；
- **将角色授予用户/其他角色**：
  - 授予用户：`grant <role name> to <user id>;`  
    示例：将`instructor`角色授予用户`Amit`：  
    `grant instructor to Amit;`
  - 授予其他角色（角色继承）：被授予角色的用户/角色会“继承”该角色的所有权限。  
    示例：创建“助教角色”`teaching_assistant`，并授予`instructor`角色（教师继承助教权限）：  
    `create role teaching_assistant; grant teaching_assistant to instructor;`

#### 2. 角色链（Role Chain）
多个角色可形成依赖链，权限沿链传递。  
示例：创建“院长角色”`dean`，使其继承“教师角色”权限，并授予用户`Satoshi`：  
`create role dean; grant instructor to dean; grant dean to Satoshi;`  
（`Satoshi`最终拥有`dean`、`instructor`、`teaching_assistant`的所有权限）。


### 六、视图的授权注意事项
视图作为“虚拟关系”，其授权需关注“权限依赖”问题，结合示例说明关键场景：
#### 1. 视图授权示例
创建“地质学教师视图”`geo_instructor`，并授予`geo_staff`用户组查询权限：  
```sql
-- 1. 创建视图（创建者需有instructor表的select权限）
create view geo_instructor as 
select * from instructor where dept_name = 'Geology';

-- 2. 授予视图权限
grant select on geo_instructor to geo_staff;
```

#### 2. 核心问题与结论
- **问题1**：若`geo_staff`无`instructor`表的权限，能否查询`geo_instructor`视图？  
  结论：**可以**。视图授权仅依赖“视图本身的权限”，用户无需直接拥有基础表权限，即可访问视图范围内的数据（实现数据隐藏）；
- **问题2**：若视图创建者缺少`instructor`表的权限，视图能否创建？授权是否有效？  
  结论：**视图创建失败**。创建视图的前提是“创建者拥有基础表的对应权限”（如`select`），否则视图无法生成，后续授权无从谈起。


### 七、其他授权特性
- **`references`权限**：创建外键时，需对“被引用表的主键列”拥有`references`权限（确保用户有权关联该表）。  
  示例：授予`Mariano`引用`department`表`dept_name`列的权限（用于创建外键）：  
  `grant reference (dept_name) on department to Mariano;`
- **`with grant option`（权限转移）**：授予权限时添加该选项，允许被授权用户将该权限“再授予其他用户”。  
  示例：授予`Amit`查询`department`表的权限，并允许其转移权限：  
  `grant select on department to Amit with grant option;`
- **`revoke`的`cascade`/`restrict`选项**：
  - `cascade`：级联撤销——撤销用户权限时，自动撤销该用户通过`with grant option`授予他人的权限；
  - `restrict`：限制撤销——若该用户已将权限授予他人，则撤销失败（需先手动收回被传递的权限）；  
    示例：级联撤销`Amit`和`Satoshi`的查询权限：  
    `revoke select on department from Amit, Satoshi cascade;`
- **`granted by current_role`**：指定“当前角色”作为授权者，而非用户自身，确保权限归属清晰（多角色切换场景适用）。


### 八、授权图与权限传递规则
授权关系可通过“授权图”可视化，清晰呈现权限的来源与传递范围：

- **授权图结构**：
  - 节点：代表用户（如`U1`、`U2`）或数据库管理员（DBA，为图的“根节点”）；
  - 边：从授权者指向被授权者（如`U1→U4`表示`U1`授予`U4`权限），边的含义是“权限传递路径”。
- **核心规则**：
  - 权限溯源：所有边必须属于“从DBA出发的路径”，即任何用户的权限最终都源于DBA（确保权限合法性）；
  - 撤销影响：若某节点的权限被撤销，所有“仅通过该节点获得权限的子节点”权限会被撤销。  
    示例：初始路径`DBA→U1→U4`、`DBA→U2→U5`；若DBA撤销`U1`的权限，`U4`因“仅依赖U1”被撤销权限，`U5`因“有U2的独立路径”保留权限。

## 触发器（Triggers）

### 一、触发器的定义与核心作用
触发器是数据库系统中一种**自动执行的特殊语句**，其本质是作为“数据库数据被修改时的副作用”存在，无需用户手动调用，仅在满足预设条件时由系统自动触发。  

- **核心目标**：补充数据库的完整性约束（如复杂业务规则校验）、实现自动化数据维护（如同步更新关联表数据），避免因手动操作导致的数据不一致。  
- **设计关键**：定义触发器时需明确两个核心要素：
  1. **触发条件**：指定“何时触发”（如数据插入、更新后）；
  2. **触发动作**：指定“触发后执行什么操作”（如修改其他表数据、校验数据合法性）。


### 二、触发事件与激活机制
触发器的执行依赖于“触发事件”和“激活时机”的组合，同时支持对数据修改前后的值进行引用，确保动作逻辑精准。

#### 1. 触发事件类型
触发事件对应数据库的基础修改操作，仅当这些操作执行时，触发器才可能被激活，主要包括三类：

- `insert`：向表中插入新元组时触发；
- `delete`：从表中删除元组时触发；
- `update`：修改表中元组时触发（可指定具体列，如`update of grade`表示仅修改`grade`列时触发）。

#### 2. 激活时机
激活时机决定触发器在“触发事件执行前”还是“执行后”生效，用于不同业务场景：

- `before`：触发事件执行前激活，常用于**数据合法性校验**或**预处理**（如将非法值修正为合法值）；
- `after`：触发事件执行后激活，常用于**关联数据同步更新**（如某表数据修改后，同步更新统计报表）。

#### 3. 数据值引用
触发器中可通过`referencing`子句引用“数据修改前后的状态”，便于对比或计算，核心语法：

- `referencing old row as <别名>`：引用修改前的元组（仅`update`、`delete`事件支持，`insert`无旧元组）；
- `referencing new row as <别名>`：引用修改后的元组（仅`insert`、`update`事件支持，`delete`无新元组）。

#### 4. 示例：空值预处理触发器
需求：当更新表`r`的`phone-number`字段时，若值为空格字符串，自动将其设为`null`。  
触发器语句：
```sql
create trigger setnull-trigger 
before update on r  -- 触发时机：更新前；触发对象：表r
referencing new row as nrow  -- 引用更新后的新元组，别名为nrow
for each row  -- 行级触发：每修改一行就执行一次动作
when nrow.phone-number = ' '  -- 触发条件：新元组的phone-number为空格
set nrow.phone-number = null;  -- 触发动作：将该字段设为null
```


### 三、行级触发与语句级触发
根据“触发动作的执行粒度”，触发器分为“行级触发”和“语句级触发”，适用场景不同。

#### 1. 行级触发（`for each row`）
- **执行逻辑**：触发事件（如`update`）每修改一行数据，触发器就执行一次动作；
- **适用场景**：需要对“每一行修改的数据”单独处理（如逐行校验、逐行同步数据）；
- **特点**：精度高，但当修改大量数据（如批量更新1000行）时，会执行1000次动作，效率较低。

#### 2. 语句级触发（`for each statement`）
- **执行逻辑**：无论触发事件修改多少行数据，触发器仅执行一次动作；
- **数据引用**：通过`referencing old table as <别名>`或`referencing new table as <别名>`，引用存储“所有修改行”的临时表，而非单一行；
- **适用场景**：对“批量修改的整体”进行处理（如统计批量更新的总行数）；
- **特点**：效率高，尤其适合大数量级的数据修改（如批量更新1000行仅执行1次动作）。


### 四、典型应用示例——维护学生总学分
需求：当学生选课表（`takes`）的成绩（`grade`）从“F”或“null”更新为“非F且非null”时，自动将对应课程的学分累加到学生表（`student`）的总学分（`tot_cred`）中。

#### 触发器完整语句
```sql
create trigger credits_earned 
after update of grade on takes  -- 触发事件：更新takes表的grade列；时机：更新后
referencing new row as nrow  -- 引用更新后的新成绩行
            old row as orow  -- 引用更新前的旧成绩行
for each row  -- 行级触发：每更新一个学生的成绩就检查一次
-- 触发条件：新成绩非F且非null，旧成绩为F或null（确保仅首次通过课程时加分）
when nrow.grade <> 'F' and nrow.grade is not null 
     and (orow.grade = 'F' or orow.grade is null)
begin atomic  -- 原子块：确保内部操作要么全执行，要么全回滚
    update student 
    set tot_cred = tot_cred + (select credits 
                               from course 
                               where course.course_id = nrow.course_id)
    where student.id = nrow.id;  -- 找到对应学生，累加课程学分
end;
```

#### 语句解析
1. **触发时机与事件**：`after update of grade on takes`——仅当`takes`表的`grade`列被更新后触发，避免其他列更新时误触发；
2. **新旧值对比**：通过`nrow`（新成绩）和`orow`（旧成绩）的对比，确保仅“成绩从不及格/未评分变为及格”时才加分，避免重复累加；
3. **原子性保障**：`begin atomic`包裹更新逻辑，防止因中间错误导致“课程学分查询成功但学生总学分未更新”的不一致问题。