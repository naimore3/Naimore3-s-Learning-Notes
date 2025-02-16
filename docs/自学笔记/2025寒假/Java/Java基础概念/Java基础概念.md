# Java基础概念
## 注释和关键字
### Java 中的注释
注释是程序里供人阅读的说明性文字，不会被编译器处理，能提升代码可读性与可维护性。Java 有三种注释类型：

#### 单行注释
以 `//` 开头，从 `//` 开始到本行末尾的内容都会被视为注释。
```java
// 这是一个单行注释，用于说明下面变量的用途
int age = 20; 
```

#### 多行注释
以 `/*` 开头，以 `*/` 结尾，中间的所有内容都属于注释，可跨越多行。
```java
/* 
这是一个多行注释，
可以用来详细描述一段代码的功能，
比如这个方法用于计算两个整数的和。
*/
int sum = add(3, 5); 
```

#### 文档注释
以 `/**` 开头，以 `*/` 结尾，主要用于为类、方法、字段等生成API文档。可以使用一些特定的标签，如 `@param`、`@return` 等。
```java
/**
 * 这是一个用于计算两个整数之和的方法。
 * @param a 第一个整数
 * @param b 第二个整数
 * @return 两个整数的和
 */
public int add(int a, int b) {
    return a + b;
}
```

### Java 中的关键字
关键字是 Java 语言预先定义好的、具有特殊含义的单词，不能将其作为标识符（如类名、方法名、变量名等）使用。{==关键字必须要小写。==}以下是一些常见的 Java 关键字：

#### 用于定义数据类型
- `int`：用于声明整型变量，如 `int num = 10;`。
- `double`：用于声明双精度浮点型变量，如 `double price = 9.99;`。
- `char`：用于声明字符型变量，如 `char grade = 'A';`。
- `boolean`：用于声明布尔型变量，只有 `true` 和 `false` 两个值，如 `boolean isReady = true;`。
- `class`：用于定义类，是面向对象编程的基础，如 `public class MyClass { }`。
- `interface`：用于定义接口，接口是一种特殊的抽象类型，如 `public interface MyInterface { }`。

#### 用于流程控制
- `if`、`else`：用于条件判断，根据条件执行不同的代码块，如：
```java
if (age >= 18) {
    System.out.println("成年人");
} else {
    System.out.println("未成年人");
}
```
- `for`、`while`、`do - while`：用于循环执行代码块，如：
```java
for (int i = 0; i < 5; i++) {
    System.out.println(i);
}
```
- `switch`、`case`、`default`：用于多分支选择，如：
```java
int day = 3;
switch (day) {
    case 1:
        System.out.println("星期一");
        break;
    case 2:
        System.out.println("星期二");
        break;
    default:
        System.out.println("其他");
}
```

#### 用于访问控制
- `public`：表示公共的，被其修饰的类、方法、字段可以被任何其他类访问。
- `private`：表示私有的，只能在定义它的类内部访问。
- `protected`：表示受保护的，能在同一包内和不同包的子类中访问。

#### 其他关键字
- `static`：用于修饰类的成员（字段、方法），被修饰的成员属于类本身，而不是类的实例。
- `final`：可修饰类、方法、变量。修饰类时，该类不能被继承；修饰方法时，该方法不能被重写；修饰变量时，该变量成为常量，值不能再改变。
- `try`、`catch`、`finally`、`throw`、`throws`：用于异常处理，保证程序在出现异常时能有相应的处理机制。 

#### Class关键字
在 Java 里，`class` 是一个极为重要的关键字，它是面向对象编程的核心基础，以下是对它的简单介绍：

##### 定义类
在 Java 中，`class` 主要用于定义类。类是对象的模板，它封装了数据（成员变量）和操作这些数据的方法。
```java
class Person {
    // 成员变量
    String name;
    int age;

    // 成员方法
    void speak() {
        System.out.println("我叫" + name + "，今年" + age + "岁。");
    }
}
```
上述代码使用 `class` 关键字定义了一个名为 `Person` 的类，该类包含两个成员变量 `name` 和 `age`，以及一个成员方法 `speak`。

##### 创建对象
定义好类之后，就可以使用 `new` 关键字结合类名来创建该类的对象。
```java
public class Main {
    public static void main(String[] args) {
        // 创建 Person 类的对象
        Person person = new Person();
        person.name = "张三";
        person.age = 20;
        person.speak();
    }
}
```
这里在 `main` 方法中创建了 `Person` 类的一个对象 `person`，并对其成员变量进行赋值，最后调用了 `speak` 方法。

##### 类的访问修饰
`class` 定义的类可以使用不同的访问修饰符，如 `public`、默认（无修饰符）等。
- `public`：被 `public` 修饰的类可以被任何其他类访问，一个 Java 源文件中只能有一个 `public` 类，并且该类名要和文件名一致。
- 默认（无修饰符）：该类只能被同一个包中的其他类访问。 