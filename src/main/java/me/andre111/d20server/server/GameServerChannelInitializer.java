package me.andre111.d20server.server;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

import io.netty.channel.Channel;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.handler.codec.LengthFieldBasedFrameDecoder;
import io.netty.handler.codec.LengthFieldPrepender;
import io.netty.handler.codec.compression.JdkZlibDecoder;
import io.netty.handler.codec.compression.JdkZlibEncoder;
import io.netty.handler.codec.json.JsonObjectDecoder;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;
import io.netty.handler.timeout.IdleStateHandler;
import io.netty.util.concurrent.DefaultEventExecutorGroup;
import io.netty.util.concurrent.EventExecutorGroup;

public class GameServerChannelInitializer extends ChannelInitializer<Channel> {
	private static final int IDLE_TIMEOUT_SECONDS = 30;
	private static final int HANDLER_THREAD_COUNT = 100;
	private static final EventExecutorGroup HANLDER_GROUP = new DefaultEventExecutorGroup(HANDLER_THREAD_COUNT);
	
	@Override
	protected void initChannel(Channel ch) throws Exception {
		ChannelPipeline pipeline = ch.pipeline();
		
		// TODO: add ssl encryption
		//SslContext sslCtx = SslContextBuilder.forServer((File) null, (File) null).build(); //TODO: add cert files
		//pipeline.addLast("ssl", sslCtx.newHandler(ch.alloc()));
		
		// add decoder stack
		pipeline.addLast("idleStateHandler", new IdleStateHandler(IDLE_TIMEOUT_SECONDS, 0, 0, TimeUnit.SECONDS));
		pipeline.addLast("zlibDecoder", new JdkZlibDecoder());
		pipeline.addLast("lengthDecoder", new LengthFieldBasedFrameDecoder(1024 * 1024, 0, 4, 0, 4)); // check length to ensure JsonObjectDecoder does not get combined objects
		pipeline.addLast("jsonObjectDecoder", new JsonObjectDecoder());
		pipeline.addLast("stringDecoder", new StringDecoder(StandardCharsets.UTF_8));
		pipeline.addLast(HANLDER_GROUP, "serverHandler", new GameServerHandler());
		
		// add encoder stack
		pipeline.addLast("zlibEncoder", new JdkZlibEncoder());
		pipeline.addLast("lengthEncoder", new LengthFieldPrepender(4)); // add length to ensure JsonObjectDecoder does not get combined objects
		pipeline.addLast("stringEncoder", new StringEncoder(StandardCharsets.UTF_8));
	}

}
