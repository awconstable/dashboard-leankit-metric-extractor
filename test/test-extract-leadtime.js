var LeanKitUrl = require('./../leankit-url');

var assert = require('assert');

describe('LeanKitUrl', function(){
  describe('#boardUrl()', function(){
    it('should return an empty string when theres no url to process', function(){
      assert.equal(LeanKitUrl.boardId(), "");
    });
  });
  describe('#boardUrl("http://accountid.leankit.com/board/123456789")', function(){
    it('should return a string equal to the board id (123456789)', function(){
      assert.equal(LeanKitUrl.boardId("http://accountid.leankit.com/board/123456789"), "123456789");
    });
  });
  describe('#boardUrl("http://accountid.leankit.com/board/")', function(){
    it('should return an empty string for malformed urls', function(){
      assert.equal(LeanKitUrl.boardId("http://accountid.leankit.com/board/"), "");
    });
  });
  describe('#boardUrl("http://accountid.leankit.com")', function(){
    it('should return an empty string for malformed urls', function(){
      assert.equal(LeanKitUrl.boardId("http://accountid.leankit.com"), "");
    });
  });
  describe('#boardUrl("sdlkfjin234234:3$5")', function(){
    it('should return an empty string for malformed urls', function(){
      assert.equal(LeanKitUrl.boardId("sdlkfjin234234:3$5"), "");
    });
  });
});
