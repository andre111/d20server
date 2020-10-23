package me.andre111.d20server.server;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import io.netty.handler.timeout.IdleStateEvent;
import me.andre111.d20common.message.Message;
import me.andre111.d20common.message.MessageDecoder;
import me.andre111.d20server.service.MessageService;
import me.andre111.d20server.service.UserService;

//TODO: code is basically duplicated from GameServerHandler
public class WebSocketServerHandler extends SimpleChannelInboundHandler<WebSocketFrame> {

	@Override
	public void channelActive(ChannelHandlerContext ctx) throws Exception {
		try {
			super.channelActive(ctx);
			UserService.onConnect(ctx.channel(), true);
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
    protected void channelRead0(ChannelHandlerContext ctx, WebSocketFrame frame) throws Exception {
        // ping and pong frames already handled

        if (frame instanceof TextWebSocketFrame textFrame) {
        	try {
    			//TODO: logging (with time tracking?)
    			Message message = MessageDecoder.decode(textFrame.text());
    			MessageService.recieve(ctx.channel(), message);
    		} catch(Exception e) {
    			e.printStackTrace();
    			throw e;
    		} finally {
    		}
        } else {
            String message = "unsupported frame type: " + frame.getClass().getName();
            throw new UnsupportedOperationException(message);
        }
    }
	
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable t) {
		//TODO: (potentially) send error message, await and close channel (will call channelInactive)
		t.printStackTrace();
	}
}
