package me.andre111.d20server.server;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.handler.timeout.IdleStateEvent;
import me.andre111.d20server.message.MessageDecoder;
import me.andre111.d20server.message.RecievableMessage;
import me.andre111.d20server.service.MessageService;
import me.andre111.d20server.service.UserService;

public class GameServerHandler extends ChannelInboundHandlerAdapter {

	@Override
	public void channelActive(ChannelHandlerContext ctx) throws Exception {
		try {
			super.channelActive(ctx);
			UserService.onConnect(ctx.channel());
		} finally {
		}
	}
	
	@Override
	public void channelInactive(ChannelHandlerContext ctx) throws Exception {
		try {
			super.channelInactive(ctx);
			UserService.onDisconnect(ctx.channel());
		} finally {
		}
	}
	
	@Override
	public void userEventTriggered(ChannelHandlerContext ctx, Object event) throws Exception {
		if(event instanceof IdleStateEvent) {
			channelIdle(ctx);
		}
	}
	public void channelIdle(ChannelHandlerContext ctx) throws Exception {
		try {
			//TODO: send timeout message, await and close channel (will call channelInactive)
		} finally {
		}
	}
	
	@Override
	public void channelRead(ChannelHandlerContext ctx, Object object) throws Exception {
		try {
			//TODO: logging (with time tracking?)
			RecievableMessage message = MessageDecoder.decode((String) object);
			message.initSource(ctx.channel());
			MessageService.recieve(message);
		} catch(Exception e) {
			throw e;
		} finally {
		}
	}
	
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable t) {
		//TODO: (potentially) send error message, await and close channel (will call channelInactive)
		t.printStackTrace();
	}
}
