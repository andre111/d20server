package me.andre111.d20server.server;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.Channel;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.handler.codec.TooLongFrameException;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpContent;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpHeaderValues;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpObject;
import io.netty.handler.codec.http.HttpRequest;
import io.netty.handler.codec.http.HttpResponse;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpUtil;
import io.netty.handler.codec.http.HttpVersion;
import io.netty.handler.codec.http.LastHttpContent;
import io.netty.handler.codec.http.multipart.DefaultHttpDataFactory;
import io.netty.handler.codec.http.multipart.FileUpload;
import io.netty.handler.codec.http.multipart.HttpDataFactory;
import io.netty.handler.codec.http.multipart.HttpPostRequestDecoder;
import io.netty.handler.codec.http.multipart.InterfaceHttpData;
import me.andre111.d20common.D20Common;
import me.andre111.d20common.model.Entity;
import me.andre111.d20common.util.DataUtils;
import me.andre111.d20common.util.Utils;
import me.andre111.d20server.service.ModuleService;

public class HttpServerHandler extends ChannelInboundHandlerAdapter {
	private static final String IMAGE_PATH = "/image/";
	private static final String UPLOAD_IMAGE_PATH = "/upload/image";
	private static final String AUDIO_PATH = "/audio/";
	private static final String UPLOAD_AUDIO_PATH = "/upload/audio";
	private static final String PUBLIC_PATH = "/public/";

	private static final HttpDataFactory factory = new DefaultHttpDataFactory(false);
	private HttpPostRequestDecoder decoder;
	private String uploadPath;

	@Override
	public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
		handleMessageReceived(ctx, (HttpObject) msg);
	}

	private void handleMessageReceived(ChannelHandlerContext ctx, HttpObject msg) throws UnsupportedEncodingException {
		// only allow get
		if (msg instanceof HttpRequest && ((HttpRequest) msg).method() == HttpMethod.GET) {
			handleGET(ctx, (HttpRequest) msg);
		} else if((msg instanceof HttpRequest && ((HttpRequest) msg).method() == HttpMethod.POST) || msg instanceof HttpContent) {
			handlePOST(ctx, msg);
		} else {
			sendError(ctx, HttpResponseStatus.METHOD_NOT_ALLOWED);
			return;
		}
	}

	private void handleGET(ChannelHandlerContext ctx, HttpRequest request) throws UnsupportedEncodingException {
		// read and check path
		String path = URLDecoder.decode(request.uri(), "UTF-8");
		if (!isValidPath(path)) {
			sendError(ctx, HttpResponseStatus.NOT_FOUND);
			return;
		}

		// response variables
		byte[] data = null;
		String contentType = null;

		// provide images
		if(path.startsWith(IMAGE_PATH)) {
			String idString = path.substring(IMAGE_PATH.length());
			long id = Long.parseLong(idString);
			Entity image = D20Common.getEntityManager("image").find(id);
			if(image != null) {
				data = Utils.readBinary("entity.image."+id);
				contentType = "image/png";
			}
		} else if(path.startsWith(AUDIO_PATH)) {
			String idString = path.substring(AUDIO_PATH.length());
			long id = Long.parseLong(idString);
			Entity audio = D20Common.getEntityManager("audio").find(id);
			if(audio != null) {
				data = Utils.readBinary("entity.audio."+id);
				contentType = "application/ogg";
			}
		} else if(path.startsWith(PUBLIC_PATH)) {
			File file = ModuleService.getFile(path);
			if(file != null && file.exists()) {
				data = Utils.readBinary(file);
				contentType = ""; //TODO: somehow set this correctly?
			}
		}

		// send response
		if(data == null) {
			sendError(ctx, HttpResponseStatus.NOT_FOUND);
			return;
		}

		// write
		//TODO: split header and content and use chunked sending (to support large files)
		HttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.OK, Unpooled.wrappedBuffer(data));
		HttpUtil.setContentLength(response, data.length);
		response.headers().set("Content-Type", contentType);
		if (!HttpUtil.isKeepAlive(request)) {
			response.headers().set(HttpHeaderNames.CONNECTION, HttpHeaderValues.CLOSE);
		} else if (request.protocolVersion().equals(HttpVersion.HTTP_1_0)) {
			response.headers().set(HttpHeaderNames.CONNECTION, HttpHeaderValues.KEEP_ALIVE);
		}

		//ctx.write(response);
		//ctx.write(data);
		//ChannelFuture writeFuture = ctx.writeAndFlush(LastHttpContent.EMPTY_LAST_CONTENT);

		ChannelFuture writeFuture = ctx.writeAndFlush(response);
		if(!HttpUtil.isKeepAlive(request)) {
			writeFuture.addListener(ChannelFutureListener.CLOSE);
		}
	}

	private void handlePOST(ChannelHandlerContext ctx, HttpObject msg) throws UnsupportedEncodingException {
		if(msg instanceof HttpRequest) {
			HttpRequest request = (HttpRequest) msg;

			// read and check path
			String path = URLDecoder.decode(request.uri(), "UTF-8");
			if(path == null || (!path.startsWith(UPLOAD_IMAGE_PATH) && !path.startsWith(UPLOAD_AUDIO_PATH))) {
				sendError(ctx, HttpResponseStatus.NOT_FOUND);
				return;
			}
			uploadPath = path;

			// create decoder
			if(decoder != null) {
				decoder.destroy();
				decoder = null;
			}
			decoder = new HttpPostRequestDecoder(factory, request);
		}
		if(msg instanceof HttpContent) {
			HttpContent content = (HttpContent) msg;

			if(decoder != null) {
				decoder.offer(content);

				// read data from decoder
				while(decoder.hasNext()) {
					InterfaceHttpData data = decoder.next();
					switch(data.getHttpDataType()) {
					case FileUpload:
						FileUpload fileUpload = (FileUpload) data;
						if(fileUpload.isCompleted()) {
							try {
								if(uploadPath.startsWith(UPLOAD_IMAGE_PATH)) {
									String imageName = fileUpload.getFilename();
									byte[] imageData = fileUpload.get();
									if(DataUtils.isValidImage(imageData)) {
										Entity image = new Entity("image");
										image.prop("name").setString(imageName);
										Utils.saveBinary("entity.image."+image.id(), imageData);
										D20Common.getEntityManager("image").add(image);
									}
								} else if(uploadPath.startsWith(UPLOAD_AUDIO_PATH)) {
									String audioName = fileUpload.getFilename();
									byte[] audioData = fileUpload.get();
									if(DataUtils.isValidAudio(audioData)) {
										Entity audio = new Entity("audio");
										audio.prop("name").setString(audioName);
										Utils.saveBinary("entity.audio."+audio.id(), audioData);
										D20Common.getEntityManager("audio").add(audio);
									}
								}
							} catch (IOException e) {
								// TODO Auto-generated catch block
								e.printStackTrace();
							}
						}
						break;
					default:
						System.out.println("Unhandled post data type: "+data.getHttpDataType());
						break;
					}
				}

				if(content instanceof LastHttpContent) {
					FullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.OK);
					ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);

					// reset decode
					decoder.destroy();
					decoder = null;
				}
			}
		}
	}

	private boolean isValidPath(String path) {
		return path != null && (path.startsWith(IMAGE_PATH) || path.startsWith(AUDIO_PATH) || path.startsWith(PUBLIC_PATH));
	}

	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		Channel ch = ctx.channel();
		if (cause instanceof TooLongFrameException) {
			sendError(ctx, HttpResponseStatus.BAD_REQUEST);
			return;
		}

		cause.printStackTrace();
		if (ch.isActive()) {
			sendError(ctx, HttpResponseStatus.INTERNAL_SERVER_ERROR);
		}
	}

	private void sendError(ChannelHandlerContext ctx, HttpResponseStatus status) {
		ByteBuf data = Unpooled.copiedBuffer("Failure: " + status.toString() + "\r\n", StandardCharsets.UTF_8);

		DefaultFullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, status, data);
		response.headers().set("Content-Type", "text/plain; charset=UTF-8");

		Channel channel = ctx.channel();
		channel.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);
	}
}
