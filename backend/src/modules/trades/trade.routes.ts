import { Router } from 'express';
import * as tradeController from './trade.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { upload, handleUploadError } from '../../middleware/upload.middleware';
import { createTradeSchema, updateTradeSchema, tradeFiltersSchema } from './trade.schema';

const router = Router();

router.use(authenticate);

router.get('/tags', tradeController.getTags);
router.get('/pairs', tradeController.getPairs);

router.get('/', validate(tradeFiltersSchema, 'query'), tradeController.getTrades);
router.post('/', validate(createTradeSchema), tradeController.createTrade);

router.get('/:id', tradeController.getTradeById);
router.put('/:id', validate(updateTradeSchema), tradeController.updateTrade);
router.delete('/:id', tradeController.deleteTrade);

router.post(
  '/:id/screenshots',
  upload.array('screenshots', 10),
  handleUploadError,
  tradeController.uploadScreenshots
);
router.delete('/:id/screenshots/:publicId', tradeController.deleteScreenshot);

router.patch('/:id/favorite', tradeController.toggleFavorite);

export default router;
