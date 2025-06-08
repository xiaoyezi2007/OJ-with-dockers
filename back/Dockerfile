# 1. 使用官方的 GCC 镜像作为基础
# 指定平台以确保在不同架构的机器上（如 Apple M系列芯片）也能正确构建
FROM --platform=linux/amd64 gcc:12.2.0

# 2. 更新软件包列表并安装 `time` 工具
# `time` 包提供了 /usr/bin/time 命令，用于精确测量后续用户程序的性能
# `&& rm -rf /var/lib/apt/lists/*` 是一个好习惯，可以清理安装缓存，减小最终镜像的体积
RUN apt-get update && \
    apt-get install -y time && \
    rm -rf /var/lib/apt/lists/*

# 3. 创建一个非 root 用户 `runner` 来运行代码，增强安全性
# 同时创建工作目录 /app 并赋予权限
RUN useradd -u 1001 -m runner && \
    mkdir /app && \
    chown -R runner:runner /app && \
    chmod 777 /app

# 4. 设置工作目录和默认用户
WORKDIR /app
USER runner

# 5. 设置容器的默认启动命令
CMD ["/bin/bash"]