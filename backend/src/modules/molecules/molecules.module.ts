import { Module } from '@nestjs/common';
import { MoleculesController } from './molecules.controller';
import { MoleculesService } from './molecules.service';
import { MOLECULE_DETECTOR_TOKEN } from './detectors/molecule-detector.interface';
import { HeuristicMoleculeDetector } from './detectors/heuristic-molecule.detector';

@Module({
  controllers: [MoleculesController],
  providers: [
    MoleculesService,
    {
      provide: MOLECULE_DETECTOR_TOKEN,
      useClass: HeuristicMoleculeDetector,
    },
  ],
  exports: [MoleculesService, MOLECULE_DETECTOR_TOKEN],
})
export class MoleculesModule {}
