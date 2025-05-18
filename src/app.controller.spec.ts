import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: jest.fn().mockReturnValue('Hello World!'),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('getHello', () => {
    it('should return hello message from service', () => {
      const getHelloSpy = jest.spyOn(appService, 'getHello');
      const expectedResult = 'Hello World!';

      const result = appController.getHello();

      expect(result).toBe(expectedResult);
      expect(getHelloSpy).toHaveBeenCalled();
    });
  });
});
