# Java入门
## 2025黑马程序员Java学习路线图
**Java基础 → Javaweb+AI → 苍穹外卖项目 → AI+若依框架 → 微服务 → 黑马头条项目、学成在线项目 → Java大厂面试专题课**
[2025黑马程序员Java学习路线图](https://www.bilibili.com/opus/494817843530680807)
## Java入门
### 人机交互
人机交互（HCI）就是研究人和机器（比如手机、电脑、智能设备）如何“沟通”的一门学问。它的目标是让技术用起来更顺手、高效，甚至有趣。  

**举个例子**：  
- 你点手机屏幕上的图标，APP 立刻打开——这就是一次成功的人机交互。  
- 你喊“嘿 Siri”，语音助手回应你——这也是一种交互方式。  

**关键点**：  
1. **界面设计**：比如按钮放哪里、颜色怎么选，让人一看就懂，不用学就会用。  
2. **交互方式**：除了点屏幕，还能用语音（如小爱同学）、手势（如隔空刷视频），甚至未来可能用脑电波控制！  
3. **用户体验**：用起来流畅吗？会不会卡顿？操作错误时系统有没有友好提示？这些都影响你对产品“好不好用”的感受。  

**为什么重要**？  
科技越复杂，越需要“人性化”设计。比如老人也能轻松用的智能手表，或者视障人士靠语音导航使用手机——好的交互设计能让人人都受益。  

**未来趋势**：虚拟现实、脑机接口……人机交互会让科技更像“无形的助手”，自然融入生活。
### 常用CMD命令
#### 文件和目录操作
- `cd`：切换目录，`cd C:\Program Files`；`cd..`返回上一级
- `mkdir`：创建目录，`mkdir new_folder`
- `rmdir`：删除空目录，`rmdir empty_folder`；`rmdir /s non_empty_folder`删非空
- `copy`：复制，`copy file.txt C:\backup`；`copy C:\source\* C:\destination`
- `move`：移动或重命名，`move file.txt C:\new_location`；`move old_name.txt new_name.txt`
- `del`：删除文件，`del file.txt`；`del *.* /q`
- `ren`：重命名，`ren old_folder new_folder`

#### 系统信息查看
- `ipconfig`：查网络配置，`ipconfig`；`ipconfig /all`
- `systeminfo`：查系统详细信息
- `tasklist`：查运行进程

#### 系统管理
- `shutdown`：关机等，`shutdown /s /t 60`；`shutdown /r /t 0`；`shutdown /l`
- `taskkill`：终止进程，`taskkill /im notepad.exe`；`taskkill /f /pid 1234`
- `net`：网络服务和用户管理，`net start wuauserv`；`net stop wuauserv`；`net user username password /add`；`net user username /delete`

#### 网络测试
- `ping`：测网络连接，`ping www.baidu.com`；`ping -t 192.168.1.1`
- `tracert`：跟踪路由，`tracert www.baidu.com`

#### 其他
- `echo`：显示文本或环境变量，`echo Hello, World!`；`echo %PATH%`
- `cls`：清屏 
### Java概述
#### 基础语法
- **变量与数据类型**：定义不同类型的变量（如int、double、String）来存储数据。
- **运算符**：使用算术、逻辑、比较等运算符进行计算和条件判断。
- **流程控制语句**：包括if - else、for、while等语句控制程序执行流程。

#### 面向对象编程
- **类与对象**：创建类作为对象的模板，实例化对象来使用类的属性和方法。
- **封装**：将数据和操作封装在类中，通过访问修饰符控制访问权限。
- **继承**：子类继承父类的属性和方法，可实现代码复用和扩展。
- **多态**：通过方法重载和方法重写实现多种形态的调用。

#### 常用类库
- **字符串处理**：如String、StringBuilder类用于处理文本数据。
- **集合框架**：List、Set、Map等集合类用于存储和操作数据。
- **输入输出**：使用File、InputStream、OutputStream等进行文件读写。

#### 异常处理
- **try - catch - finally**：捕获和处理程序运行时的异常，增强程序健壮性。

#### 多线程编程
- **Thread类与Runnable接口**：创建和管理线程，实现多任务并发执行。

#### 数据库编程
- **JDBC**：使用Java数据库连接，实现与数据库的交互。 
### Java语言的发展
Java由Sun Microsystems于1995年推出，初衷用于消费类电子产品编程，后以“一次编写，到处运行”的跨平台特性崭露头角。

1996年发布JDK 1.0，开启Java商业旅程。随后的JDK 1.2引入重要的集合框架等，Java 2时代让其在企业级开发、桌面应用、移动端崭露头角。

2006年开源并推出Java EE，Java在企业开发中占据主导地位。

2011年Java 7增加很多实用特性。Oracle收购Sun后，Java 8引入Lambda表达式和Stream API等，推动函数式编程。

此后Java不断快速迭代，从Java 9到Java 21，模块化系统、垃圾回收器改进、新特性持续推出，巩固其在企业级开发、大数据、云计算等领域的地位。 
### Java跨平台运行的原理
Java能跨平台运行的核心在于“一次编写，到处运行”，其原理主要基于Java虚拟机（JVM）和字节码机制，具体如下：
#### 编译生成字节码
Java程序编写完成后，Java编译器（javac）会将 `.java` 源文件编译成 `.class` 字节码文件。字节码是一种中间形式的代码，它不针对特定的操作系统或硬件平台，而是一种与平台无关的表示形式。
#### Java虚拟机（JVM）
JVM是Java实现跨平台的关键。不同操作系统（如Windows、Linux、macOS）都有各自对应的JVM实现版本。当运行Java程序时，JVM负责加载字节码文件，并将字节码解释或编译成对应平台能够执行的机器码。
#### 运行机制
不同平台上的JVM屏蔽了底层操作系统和硬件的差异，为Java程序提供了统一的运行环境。只要在目标平台上安装了相应的JVM，就可以运行Java字节码文件，从而实现Java程序的跨平台运行。 
### JDK和JRE
#### JDK（Java Development Kit）
JDK即Java开发工具包，是Java开发人员用于开发Java程序的必备工具。它包含了JRE和一系列开发工具。
 - **JRE**：保证Java程序能运行的基础环境。
 - **开发工具**：像编译器 `javac`，能把 `.java` 源文件编译成 `.class` 字节码文件；调试器 `jdb`，可帮助开发者查找和修复代码中的问题。

#### JRE（Java Runtime Environment）
JRE是Java运行时环境，为Java程序的运行提供了所需的环境。
 - **Java虚拟机（JVM）**：负责加载字节码文件，并将字节码解释或编译成机器码，让程序能在不同操作系统上运行。
 - **核心类库**：包含了Java程序运行时所依赖的基本类，如字符串处理、集合框架等类。

简单来说，JDK用于开发Java程序，JRE用于运行Java程序。若只需要运行已有的Java程序，安装JRE即可；若要开发Java程序，则必须安装JDK。 