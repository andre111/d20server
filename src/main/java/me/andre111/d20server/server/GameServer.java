package me.andre111.d20server.server;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelOption;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioServerSocketChannel;

public class GameServer {

	public static void start(int port) {
		// TODO: logging, test db connection, init services, clear logged in state of
		// all players

		bootstrap(port);
		Runtime.getRuntime().addShutdownHook(new Thread(GameServer::onShutdown, "server-shutdown"));
	}

	private static void bootstrap(int port) {
		NioEventLoopGroup bossGroup = new NioEventLoopGroup();
		NioEventLoopGroup workerGroup = new NioEventLoopGroup();

		ServerBootstrap bootstrap = new ServerBootstrap();
		bootstrap.group(bossGroup, workerGroup);
		bootstrap.channel(NioServerSocketChannel.class);

		bootstrap.childHandler(new GameServerChannelInitializer());

		bootstrap.option(ChannelOption.SO_REUSEADDR, true);
		bootstrap.childOption(ChannelOption.TCP_NODELAY, true);
		bootstrap.childOption(ChannelOption.SO_KEEPALIVE, true);
		bootstrap.childOption(ChannelOption.SO_RCVBUF, 65536);

		bootstrap.bind(port).syncUninterruptibly();
	}

	private static void onShutdown() {
		// TODO: broadcast shutdown message (and await sending)
		// TODO: clear logged in state of all players
	}
}
