package me.andre111.d20server.server;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.handler.timeout.IdleStateEvent;
import me.andre111.d20common.message.Message;
import me.andre111.d20common.message.MessageDecoder;
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
			UserService.onDisconnect(ctx.channel());
			super.channelInactive(ctx);
		} finally {
			ctx.channel().close();
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
			Message message = MessageDecoder.decode((String) object);
			MessageService.recieve(ctx.channel(), message);
		} catch(Exception e) {
			e.printStackTrace();
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
