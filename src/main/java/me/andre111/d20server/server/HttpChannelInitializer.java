package me.andre111.d20server.server;

import io.netty.channel.Channel;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.handler.codec.http.HttpRequestDecoder;
import io.netty.handler.codec.http.HttpResponseEncoder;

public class HttpChannelInitializer extends ChannelInitializer<Channel> {
    public void initChannel(Channel channel) throws Exception {
        ChannelPipeline pipeline = channel.pipeline();
        
		// add decoder stack
        pipeline.addLast("decoder", new HttpRequestDecoder());

		// add encoder stack
        pipeline.addLast("encoder", new HttpResponseEncoder());
        
        pipeline.addLast("handler", new HttpServerHandler());
    }
}
