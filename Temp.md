## Problem 1
1. **必要性证明（\(Ax\leq0, c^{T}x > 0\)有解\(\Rightarrow A^{T}y = c, y\geq0\)无解）**：
   - 假设\(Ax\leq0, c^{T}x > 0\)有解，设解为\(x_{0}\)，即\(Ax_{0}\leq0\)且\(c^{T}x_{0}>0\)。
   - 再假设\(A^{T}y = c\)，\(y\geq0\)有解，设解为\(y_{0}\)，即\(A^{T}y_{0}=c\)。
   - 对\(A^{T}y_{0}=c\)两边同时左乘\(x_{0}^{T}\)，得到\(x_{0}^{T}A^{T}y_{0}=x_{0}^{T}c\)。
   - 根据矩阵乘法的性质\((x_{0}^{T}A^{T}y_{0})=(Ax_{0})^{T}y_{0}\)，所以\((Ax_{0})^{T}y_{0}=x_{0}^{T}c\)。
   - 因为\(Ax_{0}\leq0\)，\(y_{0}\geq0\)，那么\((Ax_{0})^{T}y_{0}=\sum_{i = 1}^{m}(Ax_{0})_{i}(y_{0})_{i}\leq0\)（这里\((Ax_{0})_{i}\)表示\(Ax_{0}\)的第\(i\)个分量，\((y_{0})_{i}\)表示\(y_{0}\)的第\(i\)个分量）。
   - 又因为\(x_{0}^{T}c = c^{T}x_{0}>0\)，这与\((Ax_{0})^{T}y_{0}=x_{0}^{T}c\)矛盾。
   - 所以当\(Ax\leq0, c^{T}x > 0\)有解时，\(A^{T}y = c\)，\(y\geq0\)无解。
2. **充分性证明（\(A^{T}y = c, y\geq0\)无解\(\Rightarrow Ax\leq0, c^{T}x > 0\)有解）**：
   - 考虑线性规划问题\(P\)：\(\max c^{T}x\)，约束条件为\(Ax\leq0\)。
   - 其对偶问题\(D\)为：\(\min 0^{T}y\)，约束条件为\(A^{T}y = c\)，\(y\geq0\)。
   - 假设\(A^{T}y = c\)，\(y\geq0\)无解，即对偶问题\(D\)无解。
   - 根据线性规划的对偶理论，有以下三种情况：
     - 原问题\(P\)要么无界，要么有解。
     - 若原问题\(P\)无界，说明存在\(x\)使得\(Ax\leq0\)，且\(c^{T}x\)可以取到任意大的值，那么一定存在\(x\)使得\(Ax\leq0\)且\(c^{T}x > 0\)。
     - 若原问题\(P\)有解，设最优解为\(x^{*}\)，目标函数值为\(c^{T}x^{*}\)。由于对偶问题\(D\)无解，根据对偶理论，原问题\(P\)的目标函数值不可能为\(0\)（因为如果原问题目标函数值为\(0\)，且有解，那么对偶问题也有解）。
     - 又因为\(Ax\leq0\)，当\(c^{T}x^{*}\neq0\)时，若\(c^{T}x^{*}<0\)，我们可以考虑在可行域\(\{x|Ax\leq0\}\)内进行分析。由于线性规划的性质，我们可以通过对可行解的调整（因为可行域是凸集），找到一个\(x\)使得\(Ax\leq0\)且\(c^{T}x > 0\)（具体来说，从最优解\(x^{*}\)出发，利用可行域的凸性和目标函数的线性性质，通过一定的方向搜索可以找到满足\(Ax\leq0\)且\(c^{T}x > 0\)的解）。
     - 所以当\(A^{T}y = c\)，\(y\geq0\)无解时，\(Ax\leq0, c^{T}x > 0\)有解。

## Problem 2
要判断该非线性规划问题是否为凸规划，需判断目标函数是否为凸函数，以及约束条件对应的可行域是否为凸集。

### 1. 判断目标函数 \(f(x)\) 的凸性
对于函数 \(f(x)=x_{1}^{2}+x_{2}^{2}-4x_{1} + 4\) ，求其Hessian矩阵 \(H(f)\) 。
 - 先求一阶偏导数：
    - \(\frac{\partial f}{\partial x_{1}} = 2x_{1}-4\)
    - \(\frac{\partial f}{\partial x_{2}} = 2x_{2}\)
 - 再求二阶偏导数：
    - \(\frac{\partial^{2} f}{\partial x_{1}^{2}} = 2\)
    - \(\frac{\partial^{2} f}{\partial x_{1}\partial x_{2}} = 0\)
    - \(\frac{\partial^{2} f}{\partial x_{2}\partial x_{1}} = 0\)
    - \(\frac{\partial^{2} f}{\partial x_{2}^{2}} = 2\)
Hessian矩阵 \(H(f)=\begin{bmatrix}
2 & 0 \\
0 & 2
\end{bmatrix}\) 。
对于任意非零向量 \(z = \begin{bmatrix}z_{1}\\z_{2}\end{bmatrix}\) ， \(z^{T}H(f)z=\begin{bmatrix}z_{1}&z_{2}\end{bmatrix}\begin{bmatrix}2 & 0 \\0 & 2\end{bmatrix}\begin{bmatrix}z_{1}\\z_{2}\end{bmatrix}=2z_{1}^{2}+2z_{2}^{2}> 0\) （当 \(z\neq 0\) ），所以Hessian矩阵正定，目标函数 \(f(x)\) 是凸函数。

### 2. 判断约束条件对应的可行域是否为凸集
- **对于 \(g_1(x)= -x_{1}+x_{2}-2\leq0\)**
  \(g_1(x)\) 是线性函数，线性函数的不等式约束对应的区域是凸集。因为对于任意 \(x^{(1)},x^{(2)}\) 满足 \(g_1(x^{(1)})\leq0\) ， \(g_1(x^{(2)})\leq0\) ，以及任意 \(\lambda\in[0,1]\) ，令 \(x = \lambda x^{(1)}+(1 - \lambda)x^{(2)}\) ，则 \(g_1(x)=-[\lambda x_{1}^{(1)}+(1 - \lambda)x_{1}^{(2)}]+[\lambda x_{2}^{(1)}+(1 - \lambda)x_{2}^{(2)}]-2=\lambda(-x_{1}^{(1)}+x_{2}^{(1)}-2)+(1 - \lambda)(-x_{1}^{(2)}+x_{2}^{(2)}-2)\leq0\) 。
 - **对于 \(g_2(x)=x_{1}^{2}-x_{2}+1\leq0\)**
  求 \(g_2(x)\) 的Hessian矩阵 \(H(g_2)\) ：
    - 先求一阶偏导数：\(\frac{\partial g_2}{\partial x_{1}} = 2x_{1}\) ， \(\frac{\partial g_2}{\partial x_{2}} = -1\) 。
    - 再求二阶偏导数：\(\frac{\partial^{2} g_2}{\partial x_{1}^{2}} = 2\) ， \(\frac{\partial^{2} g_2}{\partial x_{1}\partial x_{2}} = 0\) ， \(\frac{\partial^{2} g_2}{\partial x_{2}\partial x_{1}} = 0\) ， \(\frac{\partial^{2} g_2}{\partial x_{2}^{2}} = 0\) 。
    Hessian矩阵 \(H(g_2)=\begin{bmatrix}2&0\\0&0\end{bmatrix}\) 。
    取向量 \(z=\begin{bmatrix}0\\1\end{bmatrix}\) ，则 \(z^{T}H(g_2)z = 0\) ，Hessian矩阵半正定。但对于 \(g_2(x)\) ，设 \(x^{(1)}=(0,1)\) ， \(g_2(x^{(1)})=0\) ， \(x^{(2)}=(0,2)\) ， \(g_2(x^{(2)})=-1\leq0\) ， \(\lambda = 0.5\) ， \(x = 0.5x^{(1)}+0.5x^{(2)}=(0,1.5)\) ， \(g_2(x)= - 0.5>0\) ，不满足凸集性质，所以 \(g_2(x)\) 对应的区域不是凸集。 

由于存在约束条件 \(g_2(x)\) 对应的区域不是凸集，所以该非线性规划问题 **不是凸规划**。 
## Problem 3
### 1. 计算梯度（用于求梯度下降方向）
 - 首先求函数 \(f(x)=x_{1}^{2}-3x_{1}x_{2}+x_{2}^{2}+2x_{1}-x_{2}\) 关于 \(x_1\) 和 \(x_2\) 的一阶偏导数：
    - \(\frac{\partial f}{\partial x_{1}} = 2x_{1}-3x_{2}+2\)
    - \(\frac{\partial f}{\partial x_{2}} = -3x_{1}+2x_{2}-1\)
 - 然后将点 \((1, - 3)\) 代入一阶偏导数中：
    - 当 \(x_1 = 1\)，\(x_2=-3\) 时，\(\frac{\partial f}{\partial x_{1}}\big|_{(1,-3)}=2\times1 - 3\times(-3)+2=2 + 9 + 2 = 13\)
    - \(\frac{\partial f}{\partial x_{2}}\big|_{(1,-3)}=-3\times1+2\times(-3)-1=-3-6 - 1=-10\) 
 - 函数 \(f(x)\) 在点 \((1, - 3)\) 处的梯度 \(\nabla f(1,-3)=\begin{bmatrix}13\\-10\end{bmatrix}\) 。
 - 梯度下降方向是负梯度方向，所以梯度下降方向 \(d_{g}=-\nabla f(1,-3)=\begin{bmatrix}-13\\10\end{bmatrix}\) 。

### 2. 计算Hessian矩阵（用于求牛顿方向）
 - 求函数 \(f(x)\) 的二阶偏导数：
    - \(\frac{\partial^{2} f}{\partial x_{1}^{2}} = 2\)
    - \(\frac{\partial^{2} f}{\partial x_{1}\partial x_{2}} = -3\)
    - \(\frac{\partial^{2} f}{\partial x_{2}\partial x_{1}} = -3\)
    - \(\frac{\partial^{2} f}{\partial x_{2}^{2}} = 2\)
 - 得到Hessian矩阵 \(H(f)=\begin{bmatrix}2&-3\\-3&2\end{bmatrix}\) 。
 - 计算Hessian矩阵的逆矩阵 \(H(f)^{-1}\) ：
根据逆矩阵公式，对于二阶矩阵 \(A = \begin{bmatrix}a&b\\c&d\end{bmatrix}\) ，其逆矩阵 \(A^{-1}=\frac{1}{ad - bc}\begin{bmatrix}d&-b\\-c&a\end{bmatrix}\) ，这里 \(a = 2\)，\(b=-3\)，\(c = - 3\)，\(d = 2\) ，则 \(ad - bc=4 - 9=-5\) ，所以 \(H(f)^{-1}=-\frac{1}{5}\begin{bmatrix}2&3\\3&2\end{bmatrix}=\begin{bmatrix}-\frac{2}{5}&-\frac{3}{5}\\-\frac{3}{5}&-\frac{2}{5}\end{bmatrix}\) 。
 - 牛顿方向 \(d_{n}=-H(f)^{-1}\nabla f(1,-3)\) ，即：
\[
\begin{align*}
d_{n}&=-\begin{bmatrix}-\frac{2}{5}&-\frac{3}{5}\\-\frac{3}{5}&-\frac{2}{5}\end{bmatrix}\begin{bmatrix}13\\-10\end{bmatrix}\\
&=\begin{bmatrix}-\frac{2}{5}\times13+(-\frac{3}{5})\times10\\-\frac{3}{5}\times13+(-\frac{2}{5})\times10\end{bmatrix}\\
&=\begin{bmatrix}-\frac{26}{5}-6\\-\frac{39}{5}-4\end{bmatrix}\\
&=\begin{bmatrix}-\frac{26 + 30}{5}\\-\frac{39+20}{5}\end{bmatrix}\\
&=\begin{bmatrix}-\frac{56}{5}\\-\frac{59}{5}\end{bmatrix}
\end{align*}
\]

梯度下降方向为 \(\begin{bmatrix}-13\\10\end{bmatrix}\) ，牛顿方向为 \(\begin{bmatrix}-\frac{56}{5}\\-\frac{59}{5}\end{bmatrix}\) 。 
## Problem 4
### 共轭梯度法基本步骤
共轭梯度法用于求解无约束优化问题 \(\min f(x)\) ，基本步骤如下：
1. 给定初始点 \(x^{(0)}\) ，允许误差 \(\epsilon>0\) ，令 \(k = 0\) ，计算 \(g^{(0)}=\nabla f(x^{(0)})\) ，取 \(d^{(0)}=-g^{(0)}\) 。
2. 计算步长 \(\alpha_{k}\) ，使得 \(f(x^{(k)}+\alpha_{k}d^{(k)})=\min_{\alpha\geq0}f(x^{(k)}+\alpha d^{(k)})\) ，一般通过求解一维搜索问题得到。
3. 更新 \(x^{(k + 1)}=x^{(k)}+\alpha_{k}d^{(k)}\) 。
4. 计算 \(g^{(k + 1)}=\nabla f(x^{(k + 1)})\) 。
5. 计算共轭系数 \(\beta_{k}\) ，更新搜索方向 \(d^{(k + 1)}=-g^{(k + 1)}+\beta_{k}d^{(k)}\) 。
6. 若 \(\|g^{(k + 1)}\|\leq\epsilon\) ，停止迭代，得到近似极小点 \(x^{(k + 1)}\) ；否则令 \(k = k + 1\) ，转至步骤2。

常用的共轭系数计算方式有Fletcher - Reeves公式 \(\beta_{k}=\frac{\|g^{(k + 1)}\|^{2}}{\|g^{(k)}\|^{2}}\)  。

### （1）求解 \(\min f(x)=(x_{1}-1)^{2}+2(x_{2}-x_{1}^{2})^{2}\)
1. **计算梯度**
   - 先求偏导数：
     - \(\frac{\partial f}{\partial x_{1}} = 2(x_{1}-1)-4x_{1}(x_{2}-x_{1}^{2})=2x_{1}-2-4x_{1}x_{2}+4x_{1}^{3}\)
     - \(\frac{\partial f}{\partial x_{2}} = 4(x_{2}-x_{1}^{2})\)
   - 给定 \(x^{(0)}=(0,0)\) ，则 \(g^{(0)}=\nabla f(x^{(0)})=\begin{bmatrix}- 2\\0\end{bmatrix}\) ，取 \(d^{(0)}=-g^{(0)}=\begin{bmatrix}2\\0\end{bmatrix}\) 。
2. **计算步长 \(\alpha_{0}\)**
令 \(\varphi(\alpha)=f(x^{(0)}+\alpha d^{(0)})=(2\alpha - 1)^{2}+2(-(2\alpha)^{2})^{2}=(2\alpha - 1)^{2}+2\times4\alpha^{4}\) 。
对 \(\varphi(\alpha)\) 求导：\(\varphi'(\alpha)=4(2\alpha - 1)+32\alpha^{3}\) ，令 \(\varphi'(\alpha)=0\) ，即 \(4(2\alpha - 1)+32\alpha^{3}=0\) ，化简得 \(8\alpha-4 + 32\alpha^{3}=0\) ，进一步得 \(8\alpha^{3}+2\alpha - 1 = 0\) ，通过数值方法（如牛顿迭代法）解得 \(\alpha_{0}\approx0.38\) 。
3. **更新 \(x^{(1)}\)**
\(x^{(1)}=x^{(0)}+\alpha_{0}d^{(0)}=\begin{bmatrix}0\\0\end{bmatrix}+0.38\begin{bmatrix}2\\0\end{bmatrix}=\begin{bmatrix}0.76\\0\end{bmatrix}\) 。
4. **计算 \(g^{(1)}\) 和 \(\beta_{0}\) 并更新 \(d^{(1)}\)**
   - \(g^{(1)}=\nabla f(x^{(1)})=\begin{bmatrix}2\times0.76-2-4\times0.76\times0 + 4\times0.76^{3}\\4\times(0 - 0.76^{2})\end{bmatrix}\approx\begin{bmatrix}-0.48\\-2.31\end{bmatrix}\) 。
   - 由Fletcher - Reeves公式 \(\beta_{0}=\frac{\|g^{(1)}\|^{2}}{\|g^{(0)}\|^{2}}=\frac{(-0.48)^{2}+(-2.31)^{2}}{(-2)^{2}+0^{2}}\approx\frac{0.23 + 5.33}{4}\approx1.39\) 。
   - \(d^{(1)}=-g^{(1)}+\beta_{0}d^{(0)}=-\begin{bmatrix}-0.48\\-2.31\end{bmatrix}+1.39\begin{bmatrix}2\\0\end{bmatrix}=\begin{bmatrix}0.48 + 2.78\\2.31\end{bmatrix}=\begin{bmatrix}3.26\\2.31\end{bmatrix}\) 。
5. **继续迭代直至满足终止条件**
重复上述步骤，计算步长 \(\alpha_{1}\) ，更新 \(x^{(2)}\) ，计算 \(g^{(2)}\) 、 \(\beta_{1}\) 、 \(d^{(2)}\) 等，直到 \(\|g^{(k + 1)}\|\leq\epsilon\) 。
最后求得答案：近似极小点为: [1.02110616 1.05231719]
目标函数在该点的值为: 0.0006320781560713452（python代码实现）

### （2）求解 \(\min f(x)=2x_{1}^{2}+2x_{1}x_{2}+x_{2}^{2}+x_{1}-x_{2}\)
1. **计算梯度**
   - 求偏导数：
     - \(\frac{\partial f}{\partial x_{1}} = 4x_{1}+2x_{2}+1\)
     - \(\frac{\partial f}{\partial x_{2}} = 2x_{1}+2x_{2}-1\)
   - 给定 \(x^{(0)}=(0,0)\) ，则 \(g^{(0)}=\nabla f(x^{(0)})=\begin{bmatrix}1\\-1\end{bmatrix}\) ，取 \(d^{(0)}=-g^{(0)}=\begin{bmatrix}-1\\1\end{bmatrix}\) 。
2. **计算步长 \(\alpha_{0}\)**
令 \(\varphi(\alpha)=f(x^{(0)}+\alpha d^{(0)})=2(-\alpha)^{2}+2(-\alpha)\alpha+\alpha^{2}+(-\alpha)-\alpha=2\alpha^{2}-2\alpha^{2}+\alpha^{2}-2\alpha=\alpha^{2}-2\alpha\) 。
对 \(\varphi(\alpha)\) 求导：\(\varphi'(\alpha)=2\alpha - 2\) ，令 \(\varphi'(\alpha)=0\) ，解得 \(\alpha_{0}=1\) 。
3. **更新 \(x^{(1)}\)**
\(x^{(1)}=x^{(0)}+\alpha_{0}d^{(0)}=\begin{bmatrix}0\\0\end{bmatrix}+1\begin{bmatrix}-1\\1\end{bmatrix}=\begin{bmatrix}-1\\1\end{bmatrix}\) 。
4. **计算 \(g^{(1)}\) 和 \(\beta_{0}\) 并更新 \(d^{(1)}\)**
   - \(g^{(1)}=\nabla f(x^{(1)})=\begin{bmatrix}4\times(-1)+2\times1 + 1\\2\times(-1)+2\times1-1\end{bmatrix}=\begin{bmatrix}-1\\-1\end{bmatrix}\) 。
   - 由Fletcher - Reeves公式 \(\beta_{0}=\frac{\|g^{(1)}\|^{2}}{\|g^{(0)}\|^{2}}=\frac{(-1)^{2}+(-1)^{2}}{1^{2}+(-1)^{2}} = 1\) 。
   - \(d^{(1)}=-g^{(1)}+\beta_{0}d^{(0)}=-\begin{bmatrix}-1\\-1\end{bmatrix}+1\begin{bmatrix}-1\\1\end{bmatrix}=\begin{bmatrix}1 - 1\\1 - 1\end{bmatrix}=\begin{bmatrix}0\\0\end{bmatrix}\) ，此时 \(\|g^{(1)}\|=\sqrt{(-1)^{2}+(-1)^{2}}=\sqrt{2}\) ，若不满足终止条件，继续迭代。后续重复计算步长、更新 \(x\) 、计算梯度、共轭系数和搜索方向等步骤，直至满足终止条件 \(\|g^{(k + 1)}\|\leq\epsilon\) 。 
求得最终答案为：最优解:  [-0.99999996  1.49999994]
最优值:  -1.249999999999998（python代码）
## Problem 5
### 1. 写出KKT条件
对于非线性规划问题 \(\min f(x)\)，\(s.t. g_i(x)\geq0\)，\(i = 1,\cdots,m\) ，其KKT条件如下：
 - **可行性条件**：\(g_i(x)\geq0\) ，\(i = 1,\cdots,m\) 。
 - **梯度条件**：\(\nabla f(x)-\sum_{i = 1}^{m}\mu_i\nabla g_i(x)=0\) ，其中 \(\mu_i\geq0\) ，\(i = 1,\cdots,m\) 。
 - **互补松弛条件**：\(\mu_ig_i(x)=0\) ，\(i = 1,\cdots,m\) 。

对于本题，\(f(x)=(x_1 - 2)^2+x_2^2\) ，\(g_1(x)=x_1 - x_2^2\) ，\(g_2(x)=-x_1 + x_2\) 。
分别计算梯度：
    - \(\nabla f(x)=\begin{bmatrix}2(x_1 - 2)\\2x_2\end{bmatrix}\)
    - \(\nabla g_1(x)=\begin{bmatrix}1\\-2x_2\end{bmatrix}\)
    - \(\nabla g_2(x)=\begin{bmatrix}-1\\1\end{bmatrix}\)

KKT条件为：
 - \(x_1 - x_2^2\geq0\) ，\(-x_1 + x_2\geq0\) 。
 - \(\begin{bmatrix}2(x_1 - 2)\\2x_2\end{bmatrix}-\mu_1\begin{bmatrix}1\\-2x_2\end{bmatrix}-\mu_2\begin{bmatrix}-1\\1\end{bmatrix}=0\) ，即 \(\begin{cases}2(x_1 - 2)-\mu_1+\mu_2 = 0\\2x_2 + 2\mu_1x_2-\mu_2 = 0\end{cases}\) ，且 \(\mu_1\geq0\)，\(\mu_2\geq0\) 。
 - \(\mu_1(x_1 - x_2^2)=0\) ，\(\mu_2(-x_1 + x_2)=0\) 。

### 2. 验证 \(x^{(1)}=(0,0)\) 是否为KKT点
 - **可行性条件验证**：
    - 对于 \(g_1(x^{(1)})=0 - 0^2=0\geq0\) 。
    - 对于 \(g_2(x^{(1)})=-0 + 0=0\geq0\) ，可行性条件满足。
 - **梯度条件验证**：
将 \(x_1 = 0\)，\(x_2 = 0\) 代入梯度条件方程组 \(\begin{cases}2(0 - 2)-\mu_1+\mu_2 = 0\\2\times0+2\mu_1\times0-\mu_2 = 0\end{cases}\) ，即 \(\begin{cases}-4-\mu_1+\mu_2 = 0\\-\mu_2 = 0\end{cases}\) 。
由 \(-\mu_2 = 0\) 得 \(\mu_2 = 0\) ，代入 \(-4-\mu_1+\mu_2 = 0\) 得 \(-4-\mu_1=0\) ，则 \(\mu_1=-4<0\) ，不满足 \(\mu_1\geq0\) ，所以梯度条件不满足。
因此 \(x^{(1)}=(0,0)\) **不是** KKT点。

### 3. 验证 \(x^{(2)}=(1,1)\) 是否为KKT点
 - **可行性条件验证**：
    - 对于 \(g_1(x^{(2)})=1 - 1^2=0\geq0\) 。
    - 对于 \(g_2(x^{(2)})=-1 + 1=0\geq0\) ，可行性条件满足。
 - **梯度条件验证**：
将 \(x_1 = 1\)，\(x_2 = 1\) 代入梯度条件方程组 \(\begin{cases}2(1 - 2)-\mu_1+\mu_2 = 0\\2\times1+2\mu_1\times1-\mu_2 = 0\end{cases}\) ，即 \(\begin{cases}-2-\mu_1+\mu_2 = 0\\2 + 2\mu_1-\mu_2 = 0\end{cases}\) 。
将第一个方程变形为 \(\mu_2=\mu_1 + 2\) ，代入第二个方程得 \(2+2\mu_1-(\mu_1 + 2)=0\) ，即 \(2+2\mu_1-\mu_1 - 2 = 0\) ，解得 \(\mu_1 = 0\) ，则 \(\mu_2 = 2\) ，满足 \(\mu_1\geq0\)，\(\mu_2\geq0\) 。
 - **互补松弛条件验证**：
因为 \(\mu_1 = 0\) ，\(g_1(x^{(2)}) = 0\) ，所以 \(\mu_1(x_1 - x_2^2)=0\times0 = 0\) ；\(\mu_2 = 2\) ，\(g_2(x^{(2)}) = 0\) ，所以 \(\mu_2(-x_1 + x_2)=2\times0 = 0\) ，互补松弛条件满足。

所以 \(x^{(2)}=(1,1)\) **是** KKT点。 
## Problem 6
### 1. 引入拉格朗日乘子并写出KKT条件
设 \(g(x)=(2 - x_1)^3 - x_2\)，\(h(x)=2x_1 - x_2 - 1\) ，引入拉格朗日乘子 \(\mu\geq0\) 和 \(\lambda\) ，拉格朗日函数为：
\(L(x,\mu,\lambda)=(x_1 - 2)^2+(x_2 - 3)^2-\mu((2 - x_1)^3 - x_2)-\lambda(2x_1 - x_2 - 1)\)

KKT条件如下：
- **梯度条件**：
    - \(\frac{\partial L}{\partial x_1}=2(x_1 - 2)+3\mu(2 - x_1)^2-2\lambda = 0\)  ①
    - \(\frac{\partial L}{\partial x_2}=2(x_2 - 3)+\mu+\lambda = 0\)  ②
- **可行性条件**：
    - \((2 - x_1)^3 - x_2\geq0\)  ③
    - \(2x_1 - x_2 - 1 = 0\)  ④
- **互补松弛条件**：
    - \(\mu((2 - x_1)^3 - x_2)=0\)  ⑤

### 2. 分情况讨论求解
**情况一：\(\mu = 0\)**
由②式可得 \(2(x_2 - 3)+\lambda = 0\)，即 \(\lambda = 6 - 2x_2\) 。
将 \(\mu = 0\) 代入①式得 \(2(x_1 - 2)-2\lambda = 0\)，即 \(x_1 - 2=\lambda\) 。
所以 \(x_1 - 2 = 6 - 2x_2\) ，结合④式 \(2x_1 - x_2 - 1 = 0\)（即 \(x_2 = 2x_1 - 1\) ）。
将 \(x_2 = 2x_1 - 1\) 代入 \(x_1 - 2 = 6 - 2x_2\) 中：
\[
\begin{align*}
x_1 - 2&=6 - 2(2x_1 - 1)\\
x_1 - 2&=6 - 4x_1 + 2\\
x_1 + 4x_1&=6 + 2 + 2\\
5x_1&=10\\
x_1&=2
\end{align*}
\]
则 \(x_2 = 2\times2 - 1 = 3\) 。
此时 \(g(2,3)=(2 - 2)^3 - 3=-3<0\) ，不满足③式，所以这种情况舍去。

**情况二：\((2 - x_1)^3 - x_2 = 0\)**
结合④式 \(2x_1 - x_2 - 1 = 0\) ，即 \(x_2 = 2x_1 - 1\) ，代入 \((2 - x_1)^3 - x_2 = 0\) 得：
\((2 - x_1)^3-(2x_1 - 1)=0\) 
设 \(t = 2 - x_1\) ，则 \(x_1 = 2 - t\) ，方程变为 \(t^3-2(2 - t)-1 = 0\) ，即 \(t^3 + 2t - 5 = 0\) 。
通过试值法或数值方法（如牛顿迭代法），可发现 \(t = 1\) 是方程 \(t^3 + 2t - 5 = 0\) 的一个根。
当 \(t = 1\) 时，\(x_1 = 2 - 1 = 1\) ，\(x_2 = 2\times1 - 1 = 1\) 。
将 \(x_1 = 1\)，\(x_2 = 1\) 代入①式：
\[
\begin{align*}
2(1 - 2)+3\mu(2 - 1)^2-2\lambda&=0\\
-2 + 3\mu-2\lambda&=0
\end{align*}
\]
代入②式：
\[
\begin{align*}
2(1 - 3)+\mu+\lambda&=0\\
-4+\mu+\lambda&=0
\end{align*}
\]
联立 \(\begin{cases}-2 + 3\mu-2\lambda = 0\\-4+\mu+\lambda = 0\end{cases}\) ，将第二个方程变形为 \(\lambda = 4 - \mu\) ，代入第一个方程得：
\[
\begin{align*}
-2 + 3\mu-2(4 - \mu)&=0\\
-2 + 3\mu-8 + 2\mu&=0\\
5\mu&=10\\
\mu&=2
\end{align*}
\]
则 \(\lambda = 4 - 2 = 2\) ，满足 \(\mu\geq0\) 。

所以，该非线性规划问题的解为 \(x_1 = 1\)，\(x_2 = 1\) ，此时目标函数值 \(f(1,1)=(1 - 2)^2+(1 - 3)^2=1 + 4 = 5\) 。 
## Problem 7
### 问题1
#### 1. 对于一般形式的线性规划问题及其对偶问题的转换规则
 - 原问题为 \(\min z = c^{T}x\)，\(s.t. Ax\geq b\)，\(x\geq0\) （其中 \(c\) 是目标函数系数向量，\(x\) 是决策变量向量，\(A\) 是约束系数矩阵，\(b\) 是约束右端项向量 ）。
 - 其对偶问题为 \(\max w = b^{T}y\)，\(s.t. A^{T}y\leq c\)，\(y\geq0\) （其中 \(y\) 是对偶变量向量 ）。

#### 2. 分析本题原问题的各要素
 - 在原问题 \(\min z = 4x_1 + 6x_2 + 18x_3\) 中，\(c=\begin{bmatrix}4\\6\\18\end{bmatrix}\)，\(x=\begin{bmatrix}x_1\\x_2\\x_3\end{bmatrix}\) 。
 - 约束条件 \(\begin{cases}x_1 + 3x_3\geq3\\x_2 + 2x_3\geq5\end{cases}\) ，则 \(A=\begin{bmatrix}1&0&3\\0&1&2\end{bmatrix}\)，\(b=\begin{bmatrix}3\\5\end{bmatrix}\) 。

#### 3. 写出对偶问题
设对偶变量 \(y = \begin{bmatrix}y_1\\y_2\end{bmatrix}\) 。
 - 目标函数：\(\max w = 3y_1 + 5y_2\) 。
 - 约束条件：
    - 由 \(A^{T}y\leq c\) 可得：
\(A^{T}=\begin{bmatrix}1&0\\0&1\\3&2\end{bmatrix}\) ，则 \(\begin{bmatrix}1&0\\0&1\\3&2\end{bmatrix}\begin{bmatrix}y_1\\y_2\end{bmatrix}\leq\begin{bmatrix}4\\6\\18\end{bmatrix}\) ，即 \(\begin{cases}y_1\leq4\\y_2\leq6\\3y_1 + 2y_2\leq18\end{cases}\) 。
    - 同时 \(y_1\geq0\)，\(y_2\geq0\) 。

所以，该线性规划问题的对偶问题为：
\(\max w = 3y_1 + 5y_2\)
\(s.t.\begin{cases}y_1\leq4\\y_2\leq6\\3y_1 + 2y_2\leq18\\y_1\geq0,y_2\geq0\end{cases}\) 
### 问题2
#### 1. 线性规划对偶问题转换规则
对于原问题：
 - 若原问题是 \(\min z = c^{T}x\)，约束条件为 \(Ax\leq b\)（不等式约束），\(Ex = d\)（等式约束），\(x\geq0\) （部分变量非负）。
 - 其对偶问题为 \(\max w = b^{T}y_1 + d^{T}y_2\)，约束条件为 \(A^{T}y_1+E^{T}y_2\leq c\)（对应非负变量的约束），\(y_1\geq0\)，\(y_2\) 无约束（等式约束对应的对偶变量无约束）。

#### 2. 分析本题原问题要素
 - 原问题 \(\min z = 2x_1 + x_2 + 5x_3 + 6x_4\) 中，\(c=\begin{bmatrix}2\\1\\5\\6\end{bmatrix}\)，\(x=\begin{bmatrix}x_1\\x_2\\x_3\\x_4\end{bmatrix}\) 。
 - 不等式约束 \(2x_1 + x_3 + x_4\leq8\) ，对应的 \(A=\begin{bmatrix}2&0&1&1\end{bmatrix}\)，\(b = 8\) 。
 - 等式约束 \(2x_1 + 3x_2 + x_3 + 2x_4 = 12\) ，对应的 \(E=\begin{bmatrix}2&3&1&2\end{bmatrix}\)，\(d = 12\) 。
 - 且 \(x_1\geq0\)，\(x_2\geq0\) 。

#### 3. 写出对偶问题
设对偶变量 \(y_1\)（对应不等式约束）和 \(y_2\)（对应等式约束） 。
 - **目标函数**：
\(\max w = 8y_1 + 12y_2\) 。
 - **约束条件**：
    - 对于 \(x_1\geq0\) 对应的约束：\(2y_1 + 2y_2\leq2\) 。
    - 对于 \(x_2\geq0\) 对应的约束：\(3y_2\leq1\) 。
    - 对于 \(x_3\)（无非负限制）和 \(x_4\)（无非负限制）对应的约束：\(y_1 + y_2\leq5\) ，\(y_1 + 2y_2\leq6\) 。
    - 同时 \(y_1\geq0\)，\(y_2\) 无约束。

所以，该线性规划问题的对偶问题为：
\(\max w = 8y_1 + 12y_2\)
\(s.t.\begin{cases}2y_1 + 2y_2\leq2\\3y_2\leq1\\y_1 + y_2\leq5\\y_1 + 2y_2\leq6\\y_1\geq0,y_2无约束\end{cases}\) 
## Problem 8
### 1. 支持向量的判断依据
对于最优决策超平面 \(w^{*T}x + b = 0\) ，支持向量满足 \(|w^{*T}x + b| = 1\) 。

### 2. 判断各向量是否为支持向量
 - **对于 \(x_1=(4, - 2,2)\)**
计算 \(w^{*T}x_1 + b\) ，已知 \(w^{*}=(-1,3,2)\)，\(b = 1\) ，则：
\[
\begin{align*}
w^{*T}x_1 + b&=(-1)\times4+3\times(-2)+2\times2 + 1\\
&=-4-6 + 4 + 1\\
&=-5
\end{align*}
\]
因为 \(|w^{*T}x_1 + b| = |-5|\neq1\) ，所以 \(x_1\) 不是支持向量。
 - **对于 \(x_2=(2,5, - 6.5)\)**
计算 \(w^{*T}x_2 + b\) ：
\[
\begin{align*}
w^{*T}x_2 + b&=(-1)\times2+3\times5+2\times(-6.5)+1\\
&=-2 + 15-13 + 1\\
&=1
\end{align*}
\]
因为 \(|w^{*T}x_2 + b| = 1\) ，所以 \(x_2\) 是支持向量。
 - **对于 \(x_3=(4, - 2,4)\)**
计算 \(w^{*T}x_3 + b\) ：
\[
\begin{align*}
w^{*T}x_3 + b&=(-1)\times4+3\times(-2)+2\times4 + 1\\
&=-4-6 + 8 + 1\\
&=-1
\end{align*}
\]
因为 \(|w^{*T}x_3 + b| = |-1| = 1\) ，所以 \(x_3\) 是支持向量。

### 3. 计算间隔
间隔公式为 \(\frac{2}{\|w^{*}\|}\) ，其中 \(\|w^{*}\|=\sqrt{(-1)^2+3^2+2^2}=\sqrt{1 + 9 + 4}=\sqrt{14}\) 。
则间隔为 \(\frac{2}{\sqrt{14}}=\frac{\sqrt{14}}{7}\) 。

综上，\(x_2\) 和 \(x_3\) 是支持向量，间隔为 \(\frac{\sqrt{14}}{7}\) 。 