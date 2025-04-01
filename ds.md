### 一元正态总体的三大抽样分布定义
|分布名称|定义|
|--|--|
|$\chi^{2}$分布|设$X_1,X_2,\cdots,X_n$相互独立，都服从正态分布$N(0,1)$，则$\chi^{2}=X_1^{2}+X_2^{2}+\cdots+X_n^{2} \sim \chi^{2}(n)$|
|$t$分布|若$X\sim N(0,1)$，$Y\sim \chi^{2}(n)$，且$X$，$Y$相互独立，则$t=\frac{X}{\sqrt{\frac{Y}{n}}}\sim t(n)$|
|$F$分布|若$U\sim \chi^{2}(n_1)$，$V\sim \chi^{2}(n_2)$，且$U$，$V$相互独立，则$F=\frac{U/n_1}{V/n_2}\sim F(n_1,n_2)$|

### 一元正态总体的抽样分布定理
|定理名称|定理内容|
|--|--|
|样本均值的分布|设$X_1,X_2,\cdots,X_n$是取自正态总体$N(\mu,\sigma^{2})$的样本，则$\overline{X}=\frac{1}{n}\sum_{i = 1}^{n}X_i\sim N(\mu,\frac{\sigma^{2}}{n})$|
|样本方差的分布|设$X_1,X_2,\cdots,X_n$是取自正态总体$N(\mu,\sigma^{2})$的样本，样本方差$s^{2}=\frac{1}{n - 1}\sum_{i = 1}^{n}(X_i-\overline{X})^{2}$，则$\frac{(n - 1)s^{2}}{\sigma^{2}}\sim \chi^{2}(n - 1)$|
|定理3（未明确名称，根据常见内容推测与$t$分布有关）|设$X_1,X_2,\cdots,X_n$是取自正态总体$N(\mu,\sigma^{2})$的样本，$\overline{X}$是样本均值，$s^{2}$是样本方差，则$t=\frac{\overline{X}-\mu}{s/\sqrt{n}}\sim t(n - 1)$|
|两总体样本均值差的分布|设$X_1,X_2,\cdots,X_{n_1}$是取自正态总体$N(\mu_1,\sigma_1^{2})$的样本，$Y_1,Y_2,\cdots,Y_{n_2}$是取自正态总体$N(\mu_2,\sigma_2^{2})$的样本，且两样本相互独立。$\overline{X}$，$\overline{Y}$分别是两样本的均值，$s_1^{2}$，$s_2^{2}$分别是两样本的方差，则当$\sigma_1^{2}=\sigma_2^{2}$时，$\frac{(\overline{X}-\overline{Y})-(\mu_1-\mu_2)}{s_w\sqrt{\frac{1}{n_1}+\frac{1}{n_2}}}\sim t(n_1 + n_2 - 2)$，其中$s_w^{2}=\frac{(n_1 - 1)s_1^{2}+(n_2 - 1)s_2^{2}}{n_1 + n_2 - 2}$；当$\sigma_1^{2}\neq\sigma_2^{2}$时，$\frac{(\overline{X}-\overline{Y})-(\mu_1-\mu_2)}{\sqrt{\frac{s_1^{2}}{n_1}+\frac{s_2^{2}}{n_2}}}\sim t(\nu)$，$\nu=\frac{(\frac{s_1^{2}}{n_1}+\frac{s_2^{2}}{n_2})^{2}}{\frac{(s_1^{2}/n_1)^{2}}{n_1 - 1}+\frac{(s_2^{2}/n_2)^{2}}{n_2 - 1}}$（近似$t$分布）  | 