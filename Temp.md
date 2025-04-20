# 乳腺癌数据集分类算法实现及分析

## 1. 问题分析
本任务旨在对乳腺癌数据集进行分类分析，通过实现K近邻、朴素贝叶斯、逻辑回归、决策树和支持向量机等多种分类算法，并与Sklearn库函数的实现进行对比，评估不同算法在该数据集上的性能表现。不使用数据集中的标记数据，仅使用属性值进行分类。

## 1.1 数据集
使用Sklearn库中的乳腺癌数据集，该数据集包含了乳腺癌的相关属性值以及对应的类别标签（良性或恶性）。通过`load_breast_cancer`函数加载数据集，然后将其划分为训练集和测试集，并进行标准化处理，以确保各特征具有相似的尺度，提高算法的性能和稳定性。

## 1.2 分类算法
需要实现K近邻、朴素贝叶斯、逻辑回归、决策树和支持向量机这五种常见的分类算法，并使用这些算法对乳腺癌数据集进行分类，计算其准确率。同时，使用Sklearn库中的对应算法作为对比，进一步验证自定义算法的有效性和性能。

## 2. 代码实现

### 2.1 K近邻算法（KNN）
K近邻算法是一种基于实例的学习算法，其基本思想是在特征空间中找到与待分类样本距离最近的K个训练样本，根据这K个样本的多数类别来确定待分类样本的类别。

```python
class KNN:
    def __init__(self, k=3):
        self.k = k

    def fit(self, X, y):
        self.X_train = X
        self.y_train = y

    def predict(self, X):
        y_pred = [self._predict(x) for x in X]
        return np.array(y_pred)

    def _predict(self, x):
        distances = [np.linalg.norm(x - x_train) for x_train in self.X_train]  # 计算欧氏距离
        k_indices = np.argsort(distances)[:self.k]  # 找到最近的K个样本索引
        k_nearest_labels = [self.y_train[i] for i in k_indices]  # 获取K个最近样本的标签
        most_common = np.bincount(k_nearest_labels).argmax()  # 统计出现最多的标签
        return most_common
```

在上述代码中，`__init__`方法初始化K值，`fit`方法存储训练数据，`predict`方法对输入数据进行预测，`_predict`方法实现了具体的预测逻辑，通过计算欧氏距离找到最近的K个样本，并根据它们的多数标签进行分类。

### 2.2 朴素贝叶斯算法
朴素贝叶斯算法基于贝叶斯定理和特征条件独立假设，通过计算每个类别在给定特征条件下的后验概率，选择后验概率最大的类别作为预测结果。

```python
class NaiveBayes:
    def fit(self, X, y):
        n_samples, n_features = X.shape
        self._classes = np.unique(y)
        n_classes = len(self._classes)

        self._mean = np.zeros((n_classes, n_features), dtype=np.float64)
        self._var = np.zeros((n_classes, n_features), dtype=np.float64)
        self._priors = np.zeros(n_classes, dtype=np.float64)

        for idx, c in enumerate(self._classes):
            X_c = X[y == c]
            self._mean[idx, :] = X_c.mean(axis=0)  # 计算每个类别下各特征的均值
            self._var[idx, :] = X_c.var(axis=0)  # 计算每个类别下各特征的方差
            self._priors[idx] = X_c.shape[0] / float(n_samples)  # 计算每个类别的先验概率

    def predict(self, X):
        y_pred = [self._predict(x) for x in X]
        return np.array(y_pred)

    def _predict(self, x):
        posteriors = []
        for idx, c in enumerate(self._classes):
            prior = np.log(self._priors[idx])  # 计算先验概率的对数
            class_conditional = np.sum(np.log(self._pdf(idx, x)))  # 计算类条件概率的对数和
            posterior = prior + class_conditional  # 计算后验概率的对数
            posteriors.append(posterior)
        return self._classes[np.argmax(posteriors)]  # 选择后验概率最大的类别

    def _pdf(self, class_idx, x):
        mean = self._mean[class_idx]
        var = self._var[class_idx]
        numerator = np.exp(-((x - mean) ** 2) / (2 * var))  # 计算概率密度函数的分子
        denominator = np.sqrt(2 * np.pi * var)  # 计算概率密度函数的分母
        return numerator / denominator  # 返回概率密度函数值
```

`fit`方法用于计算每个类别下各特征的均值、方差以及类别的先验概率；`predict`方法对输入数据进行预测，`_predict`方法实现了具体的预测逻辑，通过计算每个类别的后验概率并选择最大的后验概率对应的类别作为预测结果，`_pdf`方法计算高斯分布的概率密度函数值。

### 2.3 逻辑回归算法
逻辑回归是一种用于解决二分类问题的线性分类模型，通过构建逻辑回归函数，将线性组合的结果映射到0到1之间的概率值，根据概率值判断样本的类别。

```python
class LogisticRegressionCustom:
    def __init__(self, learning_rate=0.01, num_iterations=1000):
        self.learning_rate = learning_rate
        self.num_iterations = num_iterations
        self.weights = None
        self.bias = None

    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)  # 初始化权重
        self.bias = 0  # 初始化偏置

        for _ in range(self.num_iterations):
            linear_model = np.dot(X, self.weights) + self.bias  # 计算线性组合
            y_pred = self._sigmoid(linear_model)  # 应用sigmoid函数得到预测概率

            dw = (1 / n_samples) * np.dot(X.T, (y_pred - y))  # 计算权重的梯度
            db = (1 / n_samples) * np.sum(y_pred - y)  # 计算偏置的梯度

            self.weights -= self.learning_rate * dw  # 更新权重
            self.bias -= self.learning_rate * db  # 更新偏置

    def predict(self, X):
        linear_model = np.dot(X, self.weights) + self.bias  # 计算线性组合
        y_pred = self._sigmoid(linear_model)  # 应用sigmoid函数得到预测概率
        y_pred_cls = [1 if i > 0.5 else 0 for i in y_pred]  # 根据概率判断类别
        return np.array(y_pred_cls)

    def _sigmoid(self, x):
        return 1 / (1 + np.exp(-x))  # sigmoid函数
```

`__init__`方法初始化学习率、迭代次数、权重和偏置；`fit`方法通过多次迭代，使用梯度下降法更新权重和偏置，以最小化损失函数；`predict`方法根据学习到的权重和偏置对输入数据进行预测，并根据概率值判断类别，`_sigmoid`方法实现了sigmoid函数。

### 2.4 决策树算法
决策树是一种基于树结构进行决策的分类算法，通过对特征进行递归划分，构建一棵决策树，根据样本在决策树上的路径来确定其类别。

```python
class Node:
    def __init__(self, feature=None, threshold=None, left=None, right=None, *, value=None):
        self.feature = feature
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value

    def is_leaf_node(self):
        return self.value is not None


class DecisionTree:
    def __init__(self, max_depth=100, min_samples_split=2, max_features=None):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features
        self.root = None

    def fit(self, X, y):
        if self.max_features is None:
            self.max_features = X.shape[1]
        self.root = self._grow_tree(X, y)

    def _grow_tree(self, X, y, depth=0):
        n_samples, n_features = X.shape
        n_labels = len(np.unique(y))

        if (depth >= self.max_depth
                or n_labels == 1
                or n_samples < self.min_samples_split):
            leaf_value = self._most_common_label(y)  # 如果满足条件，返回多数类标签作为叶节点值
            return Node(value=leaf_value)

        feature_indices = np.random.choice(n_features, self.max_features, replace=False)
        best_feature, best_threshold = self._best_criteria(X, y, feature_indices)  # 选择最佳划分特征和阈值
        left_indices, right_indices = self._split(X[:, best_feature], best_threshold)  # 划分数据集
        left = self._grow_tree(X[left_indices, :], y[left_indices], depth + 1)  # 递归构建左子树
        right = self._grow_tree(X[right_indices, :], y[right_indices], depth + 1)  # 递归构建右子树
        return Node(best_feature, best_threshold, left, right)  # 返回节点

    def _best_criteria(self, X, y, feature_indices):
        best_gini = 1
        split_idx, split_thresh = None, None
        for feature_index in feature_indices:
            X_column = X[:, feature_index]
            thresholds = np.unique(X_column)
            for threshold in thresholds:
                gini = self._gini_impurity(X_column, y, threshold)  # 计算基尼不纯度
                if gini < best_gini:
                    best_gini = gini
                    split_idx = feature_index
                    split_thresh = threshold
        return split_idx, split_thresh

    def _gini_impurity(self, X_column, y, threshold):
        n = len(y)
        left_indices = X_column < threshold
        right_indices = ~left_indices
        n_left = np.sum(left_indices)
        n_right = n - n_left
        if n_left == 0 or n_right == 0:
            return 0
        gini_left = 1 - sum((np.sum(y[left_indices] == c) / n_left) ** 2 for c in np.unique(y))  # 计算左子树的基尼不纯度
        gini_right = 1 - sum((np.sum(y[right_indices] == c) / n_right) ** 2 for c in np.unique(y))  # 计算右子树的基尼不纯度
        return (n_left / n) * gini_left + (n_right / n) * gini_right  # 计算总的基尼不纯度

    def _split(self, X_column, split_thresh):
        left_indices = X_column < split_thresh
        return left_indices, ~left_indices

    def _most_common_label(self, y):
        if len(y) == 0:
            return 0  # 返回默认值
        unique_labels, counts = np.unique(y, return_counts=True)
        return unique_labels[np.argmax(counts)]  # 返回出现最多的标签

    def predict(self, X):
        return np.array([self._traverse_tree(x, self.root) for x in X])  # 对输入数据进行预测

    def _traverse_tree(self, x, node):
        if node.is_leaf_node():
            return node.value
        if x[node.feature] < node.threshold:
            return self._traverse_tree(x, node.left)  # 向左子树遍历
        return self._traverse_tree(x, node.right)  # 向右子树遍历
```

`Node`类定义了决策树的节点结构；`DecisionTree`类实现了决策树的构建和预测过程。`fit`方法开始构建决策树，`_grow_tree`方法递归地构建决策树，`_best_criteria`方法选择最佳的划分特征和阈值，`_gini_impurity`方法计算基尼不纯度，`_split`方法根据阈值划分数据集，`_most_common_label`方法返回多数类标签，`predict`方法对输入数据进行预测，`_traverse_tree`方法遍历决策树以确定样本的类别。

### 2.5 支持向量机算法（SVM）
支持向量机是一种通过寻找最优超平面来进行分类的算法，目标是最大化分类间隔，使不同类别的样本尽可能分开。

```python
class SVM:
    def __init__(self, learning_rate=0.001, lambda_param=0.01, num_iterations=1000):
        self.lr = learning_rate
        self.lambda_param = lambda_param
        self.num_iterations = num_iterations
        self.w = None
        self.b = None

    def fit(self, X, y):
        n_samples, n_features = X.shape
        y_ = np.where(y <= 0, -1, 1)
        self.w = np.zeros(n_features)  # 初始化权重
        self.b = 0  # 初始化偏置

        for _ in range(self.num_iterations):
            for idx in np.random.permutation(n_samples):
                x_i = X[idx]
                condition = y_[idx] * (np.dot(x_i, self.w) - self.b) >= 1  # 判断样本是否满足条件
                if condition:
                    self.w -= self.lr * (2 * self.lambda_param * self.w)  # 更新权重（满足条件时）
                else:
                    self.w -= self.lr * (2 * self.lambda_param * self.w - np.dot(x_i, y_[idx]))  # 更新权重（不满足条件时）
                    self.b -= self.lr * y_[idx]  # 更新偏置

    def predict(self, X):
        approx = np.dot(X, self.w) - self.b  # 计算决策函数值
        return np.sign(approx)  # 根据决策函数值判断类别
```

`__init__`方法初始化学习率、正则化参数、迭代次数、权重和偏置；`fit`方法通过多次迭代，使用随机梯度下降法更新权重和偏置，以找到最优超平面；`predict`方法根据学习到的权重和偏置对输入数据进行预测，并根据决策函数值判断类别。

## 3. 结论
通过实现K近邻、朴素贝叶斯、逻辑回归、决策树和支持向量机这五种分类算法，并对乳腺癌数据集进行分类实验，同时与Sklearn库函数的实现进行对比，得到了不同算法在该数据集上的准确率。实验结果表明，不同算法在乳腺癌数据集上的表现各有优劣，Sklearn库函数的实现通常具有较高的效率和准确性。

自定义算法的实现过程有助于深入理解各种分类算法的原理和工作机制，在实际应用中，可以根据具体问题的特点和需求选择合适的分类算法。同时，对于大规模数据集和复杂问题，可能需要进一步优化算法或采用集成学习等方法来提高分类性能。