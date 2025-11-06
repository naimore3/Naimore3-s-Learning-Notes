# Chapter5: Database Design Using the E-R Model
### 第六章：Database Design Using the E-R Model

#### 设计阶段（Design Phases）
- **初始阶段**：全面描述潜在数据库用户的数据需求。
- **概念设计**：选择数据模型，将需求翻译成概念模式（conceptual schema），包括功能需求（operations/transactions）。
- **逻辑设计（Logical Design）**：决定数据库模式（schema）。涉及业务决策（记录哪些属性）和计算机科学决策（关系模式的设计和属性分布）。
- **物理设计（Physical Design）**：决定数据库的物理布局。
- **设计方法**：
  - 实体-关系模型（E-R Model）：本章焦点。
  - 规范化理论（Normalization Theory）：第7章。

#### 数据库设计过程（Database Design Process）
- **阶段**：
  - 需求分析（Requirements Analysis）。
  - 概念模式设计（Conceptual Schema Design）：E-R图（Chapter 6）。
  - 逻辑模式设计（Logical Schema Design）：关系数据模式。
  - 物理模式设计（Physical Schema Design）：物理存储结构和访问方法（Chapter 13）。
  - 实现（Implementation）。
  - 系统测试（System Testing）。
  - 交付与维护（Delivery & Maintenance）。
- **DB设计阶段**：
  - 从现实世界应用问题开始。
  - 需求分析 → 概念设计（E-R模型） → 逻辑设计（关系模型） → 物理设计。
- **生命周期模型**：包括规划与分析、设计、系统实现与部署、运行维护。
- **抽象与模式**：
  - 物理抽象：内部模式（Internal Schema, IS）。
  - 逻辑抽象/视图抽象：逻辑模式（Logical Schema, LS）和外部模式。
  - 概念模式：多个概念模式。

#### E-R模型概述（Entity-Relationship Model -- Database Modeling）
- **目的**：促进数据库设计，通过企业模式（enterprise schema）表示数据库的整体逻辑结构。
- **基本概念**：
  - 实体集（Entity Sets）。
  - 关系集（Relationship Sets）。
  - 属性（Attributes）。
- **E-R图**：图形表示数据库逻辑结构。
- **实体集**：
  - 实体：存在且可区分的对象（e.g., person, company）。
  - 实体集：相同类型实体的集合，共享属性（e.g., instructor = (ID, name, street, city, salary)）。
  - 主键：唯一标识实体集成员的属性子集。
- **示例**：instructor 和 student 实体集。

#### 属性（Attributes）
- **类型**：
  - 简单属性（Simple）和复合属性（Composite）。
  - 单值属性（Single-valued）和多值属性（Multivalued）：e.g., phone_numbers。
  - 派生属性（Derived）：从其他属性计算（e.g., age from date_of_birth）。
- **域（Domain）**：每个属性的允许值集。
- **复合属性示例**：图形表示层次结构。

#### 关系集（Relationship Sets）
- **定义**：几个实体间的关联。
- **示例**：advisor 关系：student (44553) advisor instructor (22222)。
- **度（Degree）**：大多数是二元（binary），少数三元或更多（ternary, e.g., proj_guide: instructor, student, project）。
- **属性**：关系集可有描述性属性（e.g., advisor 有 date）。
- **冗余属性**：避免重复（e.g., instructor 中的 dept_name 与 inst_dept 关系重复）。
- **角色（Roles）**：在自关联中指定（e.g., prereq 中的 course_id 和 prereq_id）。

#### 映射基数约束（Mapping Cardinality Constraints）
- **类型**（对于二元关系）：
  - 一对一（One to one）。
  - 一对多（One to many）。
  - 多对一（Many to one）。
  - 多对多（Many to many）。
- **表示**：A 和 B 中的元素可能不映射到对方。
- **示例**：图形表示 one-to-one, one-to-many 等。

#### 弱实体集（Weak Entity Sets）
- **定义**：存在依赖于标识实体（identifying entity）的实体集。
- **示例**：section 依赖 course；section 无足够属性唯一标识（需 course_id）。
- **标识关系（Identifying Relationship）**：弱实体与强实体间的关系。
- **鉴别符（Discriminator）**：额外属性唯一标识弱实体。
- **存在依赖（Existence Dependent）**：弱实体必须关联标识实体。
- **处理冗余**：删除冗余关系，如 sec_course。

#### E-R图（E-R Diagrams）
- **符号**：
  - 矩形：实体集。
  - 属性：列在实体矩形内，主键下划线。
  - 菱形：关系集。
  - 线：连接实体到关系。
  - 双矩形：弱实体集。
  - 双菱形：标识关系。
  - 虚线：派生属性。
  - 圆圈：多值属性。
- **基数约束**：箭头（→）表示“一”，无向线（—）表示“多”。
- **参与约束**：双线表示总参与（total participation）。
- **替代符号**：Chen, IDE1FX (Crows feet notation)。

#### 设计问题（Design Issues）
- **实体 vs. 属性**：使用实体允许额外信息（e.g., phone as entity）。
- **实体 vs. 关系集**：关系集表示实体间的动作。
- **关系属性放置**：作为关系属性或实体属性。
- **二元 vs. 非二元关系**：非二元可清晰显示多实体参与，但可转换为二元。
- **转换为二元**：创建人工实体 E，三个关系 RA, RB, RC；添加约束确保一致性。
- **设计决策**：属性/实体、关系/实体、 ternary vs. binary、强/弱实体、特化/泛化、聚合。

#### 扩展E-R特性（Extended E-R Features）
- **特化（Specialization）**：自顶向下，将高层实体分解为低层子类（e.g., person → employee, student）。
  - 表示：三角形标注 "ISA"。
- **泛化（Generalization）**：自底向上，合成高层实体。
- **约束**：
  - 条件定义（Condition-defined）/用户定义（User-defined）。
  - 不相交（Disjoint）/重叠（Overlapping）。
  - 总特化（Total）/部分特化（Partial）。
- **聚合（Aggregation）**：将关系视为抽象实体，允许关系间关系（e.g., proj_guide + eval_for）。
  - 消除冗余：将 proj_guide 聚合为实体，与 eval_for 关联。

#### 银行数据库设计（Design of the Bank Database）
- PPT中提及，但无具体细节；假设标准银行实体如 customer, account 等。

#### 到关系模式的归约（Reduction to Relation Schemas）
- **实体集**：
  - 强实体：直接转换为模式（e.g., student(ID, name, tot_cred)）。
  - 弱实体：包括标识实体的主键 + 鉴别符（e.g., section(course_id, sec_id, semester, year)）。
- **复合属性**：展平（e.g., name → first_name, last_name）。
- **多值属性**：单独模式（e.g., inst_phone(ID, phone_number)）。
- **关系集**：
  - 多对多：主键 + 描述属性（e.g., advisor(s_id, i_id)）。
  - 多对一/一对多（总参与）：在“多”侧添加“一”侧主键（e.g., instructor 中的 dept_name）。
  - 一对一：任意侧添加。
  - 弱实体关系：冗余，可删除。
- **特化**：
  - 方法1：高层模式 + 每个低层模式（包括高层主键）。
  - 方法2：每个实体模式包括所有继承属性（可能冗余）。
- **聚合**：聚合关系的主键 + 关联实体主键 + 描述属性（e.g., eval_for(s_ID, project_id, i_ID, evaluation_id)）；冗余模式可删除。

#### UML
- **UML 类图**：对应E-R图，但有差异。
- **差异**：
  - 基数位置反转。
  - 泛化：合并/分离箭头，与 disjoint/overlapping 无关。
  - 二元关系：线连接实体，名称相邻；角色标注；属性在框中，用点线连接。
- **等价**：ER 和 UML 的符号比较。

#### 总结（Summary of Symbols Used in E-R Notation）
- 标准符号：实体、关系、属性、弱实体等。
- 替代符号：Chen, IDE1FX。
- E-R设计决策：促进模块化，避免冗余。