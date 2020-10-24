package me.andre111.d20server.server;

import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import io.netty.handler.codec.http.websocketx.extensions.compression.WebSocketServerCompressionHandler;
import io.netty.handler.ssl.SslContext;

public class HttpServerChannelInitializer extends ChannelInitializer<SocketChannel> {
	private final SslContext sslCtx;

    public HttpServerChannelInitializer(SslContext sslCtx) {
        this.sslCtx = sslCtx;
    }
	
    public void initChannel(SocketChannel channel) throws Exception {
        ChannelPipeline pipeline = channel.pipeline();
        if (sslCtx != null) {
            pipeline.addLast(sslCtx.newHandler(channel.alloc()));
        }
        pipeline.addLast(new HttpServerCodec());
        //pipeline.addLast(new HttpContentCompressor());
        pipeline.addLast(new HttpObjectAggregator(1024 * 1024 * 100));
        pipeline.addLast(new WebSocketServerCompressionHandler());
        pipeline.addLast(new WebSocketServerProtocolHandler("/ws", null, true));
        pipeline.addLast(new HttpServerHandler());
        pipeline.addLast(new WebSocketServerHandler());
    }
}
