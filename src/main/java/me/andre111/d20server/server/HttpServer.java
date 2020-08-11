package me.andre111.d20server.server;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioServerSocketChannel;

public class HttpServer {
	public static void start(int port) {
		bootstrap(port);
		Runtime.getRuntime().addShutdownHook(new Thread(HttpServer::onShutdown, "server-shutdown-2"));
	}

	private static void bootstrap(int port) {
		NioEventLoopGroup bossGroup = new NioEventLoopGroup();
		NioEventLoopGroup workerGroup = new NioEventLoopGroup();

		ServerBootstrap bootstrap = new ServerBootstrap();
		bootstrap.group(bossGroup, workerGroup);
		bootstrap.channel(NioServerSocketChannel.class);

		bootstrap.childHandler(new HttpServerChannelInitializer());

		bootstrap.bind(port).syncUninterruptibly();
	}

	private static void onShutdown() {
	}
}
