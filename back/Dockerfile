FROM --platform=linux/amd64 gcc:12.2.0

# 2. 添加一个简单的测试步骤，验证 shell 和 gcc (可选，主要用于构建时调试)
# RUN /bin/sh --version && gcc --version

# 创建用户时指定 UID
RUN useradd -u 1001 -m runner && \
    mkdir /app && \
    chown -R runner:runner /app && \
    chmod 777 /app  

WORKDIR /app
USER runner

# 4. 设置默认命令为 bash (这部分是好的，保持即可)
CMD ["/bin/bash"]