const Router = require('express');
const multer = require('multer');
const multerConfig = require('./config/multer');

const Post = require('./models/Post');

const routes = Router();

routes.get('/posts', async (req, res) => {
  const posts = await Post.find();

  return res.json(posts);
});

routes.post('/posts', multer(multerConfig).single('file'), async (req, res) => {

  if (process.env.STORAGE_TYPE === 'firebaseStorage') {
    var { originalname: name, publicUrl: url = '' } = req.file;

    var { name: key, size } = req.file.fileRef.metadata;
  } else {
    var { originalname: name, size, key, location: url = '' } = req.file;
  }

  const post = await Post.create({
    name,
    size,
    key,
    url, 
  })

  return res.json(post);
});

routes.delete('/posts/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);

  await post.remove(); 

  return res.send();
})

module.exports = routes;

